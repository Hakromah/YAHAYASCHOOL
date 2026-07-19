/**
 * finance-receipt lifecycles.ts
 *
 * CRITICAL: All DB updates run SYNCHRONOUSLY inside afterCreate (no process.nextTick).
 * This ensures invoice balances and student advance wallet are updated BEFORE
 * Strapi returns the HTTP response, so the frontend re-fetch always sees fresh data.
 *
 * Overpayment Logic:
 *   - If paymentAmount > invoice remainingBalance → excess goes to student.advanceBalance
 *   - If no invoice linked → entire amount goes to student.advanceBalance as advance credit
 *   - Advance wallet can be applied to future invoices by the cashier
 */

export default {
  async afterCreate(event: any) {
    const { result } = event;
    if (!result) return;

    const rawData = event.params?.data || {};
    const paymentMetadata = result.paymentMetadata || rawData.paymentMetadata || {};

    if (paymentMetadata.isCombined || (paymentMetadata.provider === 'Advance Wallet' && paymentMetadata.gatewayStatus === 'AUTO_APPLIED')) {
      strapi.log.info(`[Receipt Lifecycle] Bypassing controller-handled receipt ${result.receiptNumber}`);
      return;
    }

    // Run synchronously — do NOT use process.nextTick so the invoice is updated
    // before the frontend re-fetches data
    try {
      const paymentAmount = Number(result.paymentAmount || rawData.paymentAmount || 0);
      const baseAmount = Number(result.baseAmount || rawData.baseAmount || paymentAmount);
      const exchangeRate = Number(result.exchangeRateToInvoice || rawData.exchangeRateToInvoice || 1);

      if (paymentAmount <= 0) return;

      // ──────────────────────────────────────────────────────────────────────
      // 1. Resolve Student ID
      // ──────────────────────────────────────────────────────────────────────
      const studentId =
        rawData.student ||
        (result.student
          ? typeof result.student === 'object'
            ? result.student.id
            : result.student
          : null);

      // ──────────────────────────────────────────────────────────────────────
      // 2. Resolve Invoice — calculate how much covers the invoice vs goes to wallet
      // ──────────────────────────────────────────────────────────────────────
      const invoiceIdOrDoc =
        rawData.invoice ||
        (result.invoice
          ? typeof result.invoice === 'object'
            ? result.invoice.documentId || result.invoice.id
            : result.invoice
          : null);

      let amountCoveringInvoice = 0; // amount used to settle invoice (in invoice currency)
      let overpaymentInPayCurrency = 0; // excess amount in payment currency → goes to wallet
      let invoiceDocumentId: string | null = null;

      if (invoiceIdOrDoc) {
        try {
          const queryField =
            typeof invoiceIdOrDoc === 'number' || !isNaN(Number(invoiceIdOrDoc))
              ? 'id'
              : 'documentId';

          const invoice = await strapi.db
            .query('api::finance-invoice.finance-invoice')
            .findOne({
              where:
                queryField === 'id'
                  ? { id: Number(invoiceIdOrDoc) }
                  : { documentId: String(invoiceIdOrDoc) },
            });

          if (invoice) {
            const invoiceId = (invoice as any).id;  // numeric ID — required by db.query().update()
            invoiceDocumentId = (invoice as any).documentId;

            const totalAmount = Number((invoice as any).totalAmount || 0);
            const alreadyPaid = Number((invoice as any).paidAmount || 0);
            const currentRemaining = Math.max(0, totalAmount - alreadyPaid);

            // Payment in invoice currency (apply exchange rate if different currency)
            const paymentInInvoiceCurrency = paymentAmount * exchangeRate;

            if (paymentInInvoiceCurrency >= currentRemaining) {
              // Overpayment or exact payment
              amountCoveringInvoice = currentRemaining;
              // Overpayment in payment currency (convert back from invoice currency)
              const overpaymentInInvoiceCurrency = paymentInInvoiceCurrency - currentRemaining;
              overpaymentInPayCurrency =
                exchangeRate > 0 ? overpaymentInInvoiceCurrency / exchangeRate : overpaymentInInvoiceCurrency;
            } else {
              // Partial payment
              amountCoveringInvoice = paymentInInvoiceCurrency;
              overpaymentInPayCurrency = 0;
            }

            const newPaidAmount = alreadyPaid + amountCoveringInvoice;
            const newRemainingBalance = Math.max(0, totalAmount - newPaidAmount);

            let newStatus = (invoice as any).status;
            if (newRemainingBalance <= 0) {
              newStatus = 'paid';
            } else if (newPaidAmount > 0) {
              newStatus = 'partially_paid';
            }

            // CRITICAL FIX: db.query().update() requires numeric {id} not {documentId}
            await strapi.db.query('api::finance-invoice.finance-invoice').update({
              where: { id: invoiceId },
              data: {
                paidAmount: newPaidAmount,
                remainingBalance: newRemainingBalance,
                status: newStatus as any,
              },
            });

            strapi.log.info(
              `[Receipt Lifecycle] Invoice ${(invoice as any).invoiceNumber} (id=${invoiceId}) updated: paid=${newPaidAmount}, remaining=${newRemainingBalance}, status=${newStatus}`
            );
          }
        } catch (err: any) {
          require('fs').appendFileSync('C:\\\\Users\\\\pc\\\\YAHAYASCHOOL\\\\strapicms\\\\invoice-error.log', `[Receipt Lifecycle] Failed to update invoice: ${err?.message || JSON.stringify(err)}\n`);
          strapi.log.error('[Receipt Lifecycle] Failed to update invoice:', err?.message || err);
        }
      } else {
        // No invoice — entire payment goes to advance wallet
        overpaymentInPayCurrency = paymentAmount;
      }

      // ──────────────────────────────────────────────────────────────────────
      // 3. Update Student Advance Wallet (Credit Overpayment or Deduct Usage)
      // ──────────────────────────────────────────────────────────────────────
      const paymentMethod = result.paymentMethod || rawData.paymentMethod;
      let walletDeduction = 0;
      if (paymentMethod === 'Advance Wallet') {
        walletDeduction = paymentAmount; // This amount was spent from the wallet
      }

      const netWalletChange = overpaymentInPayCurrency - walletDeduction;

      if (studentId && netWalletChange !== 0) {
        try {
          const student = await strapi.db.query('api::student.student').findOne({
            where: { id: Number(studentId) },
          });

          if (student) {
            const currentAdvance = Number((student as any).advanceBalance || 0);
            const newAdvance = currentAdvance + netWalletChange;

            await strapi.db.query('api::student.student').update({
              where: { id: Number(studentId) },
              data: { advanceBalance: newAdvance } as any,
            });

            // Create Wallet Transaction Entry
            const txType = netWalletChange > 0 ? 'advance_deposit' : 'wallet_used';
            const changeAmount = Math.abs(netWalletChange);
            const lastWalletTx = await strapi.db.query('api::wallet-transaction.wallet-transaction').findOne({
              where: { student: Number(studentId) },
              orderBy: { transactionDate: 'desc' },
            }) as any;
            const prevWalletRunning = lastWalletTx ? Number(lastWalletTx.runningBalance || 0) : 0;
            const newWalletRunning = prevWalletRunning + netWalletChange;

            await strapi.db.query('api::wallet-transaction.wallet-transaction').create({
              data: {
                student: Number(studentId),
                transactionType: txType,
                amount: changeAmount,
                runningBalance: newWalletRunning,
                referenceNumber: result.receiptNumber,
                user: 'System / Lifecycle',
                reason: txType === 'advance_deposit' ? 'Excess payment credit to wallet' : 'Wallet used to settle invoice',
                transactionDate: new Date().toISOString(),
              },
            });

            strapi.log.info(
              `[Receipt Lifecycle] Student ${(student as any).schoolId} advance wallet: ${currentAdvance} → ${newAdvance} (change: ${netWalletChange > 0 ? '+' : ''}${netWalletChange})`
            );
          }
        } catch (err: any) {
          strapi.log.error('[Receipt Lifecycle] Failed to update student advance wallet:', err?.message || err);
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // 4. Student Ledger Entry (running balance tracks total owed)
      // ──────────────────────────────────────────────────────────────────────
      if (studentId) {
        try {
          const lastLedger = await strapi.db
            .query('api::finance-ledger-entry.finance-ledger-entry')
            .findOne({
              where: { student: Number(studentId) },
              orderBy: { transactionDate: 'desc' },
            });

          const prevRunning = lastLedger ? Number((lastLedger as any).runningBalance || 0) : 0;
          // Running balance: increases with invoices (debits), decreases with receipts/payments (credits)
          const newRunningBalance = prevRunning - baseAmount;

          const ledgerType = overpaymentInPayCurrency > 0 && amountCoveringInvoice === 0
            ? 'advance_deposit'
            : overpaymentInPayCurrency > 0
            ? 'credit_with_advance'
            : 'credit';

          const description =
            overpaymentInPayCurrency > 0
              ? `Payment Received: ${result.receiptNumber} (Invoice settled + $${overpaymentInPayCurrency.toFixed(2)} credited to Advance Wallet)`
              : `Payment Received: ${result.receiptNumber}`;

          await strapi.db.query('api::finance-ledger-entry.finance-ledger-entry').create({
            data: {
              student: Number(studentId),
              documentNumber: result.receiptNumber,
              type: ledgerType,
              description,
              baseAmount: baseAmount,
              runningBalance: newRunningBalance,
              transactionDate: new Date().toISOString().split('T')[0],
            } as any,
          });
        } catch (err: any) {
          strapi.log.error('[Receipt Lifecycle] Failed to create ledger entry:', err?.message || err);
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // 5. Double-Entry Journal (Debit Cash, Credit A/R)
      // ──────────────────────────────────────────────────────────────────────
      try {
        const entryNumber = `JRN-${Date.now()}`;
        await strapi.db.query('api::finance-journal-entry.finance-journal-entry').create({
          data: {
            entryNumber,
            date: new Date().toISOString().split('T')[0],
            description: `Payment Receipt ${result.receiptNumber}`,
            totalDebitBase: baseAmount,
            totalCreditBase: baseAmount,
            status: 'posted',
            lines: [
              { account: 'Cash / Bank', type: 'debit', amount: baseAmount },
              { account: 'Accounts Receivable', type: 'credit', amount: baseAmount },
            ],
          } as any,
        });
      } catch (err: any) {
        // Journal entry is secondary — log but do not block
        strapi.log.warn('[Receipt Lifecycle] Journal entry failed:', err?.message || err);
      }
    } catch (err: any) {
      strapi.log.error('[Receipt Lifecycle] Critical afterCreate error:', err?.message || err);
    }
  },
};
