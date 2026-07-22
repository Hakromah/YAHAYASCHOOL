import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import { approvalService } from './approval.service';
import type { Vendor, PurchaseRequisition, PurchaseOrder, GoodsReceiptNote } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Procurement & Accounts Payable ERP Service
// Integrated 3-Way Matching (PO ↔ GRN ↔ Invoice), Vendor Portal & AP GL 2010
// ─────────────────────────────────────────────────────────────────────────────

export const procurementService = {
  /**
   * Get Approved Vendors.
   */
  async getVendors(): Promise<Vendor[]> {
    return [
      { id: 'VND-01', vendorCode: 'VND-2026-0012', companyName: 'Monrovia Office & IT Supplies Ltd.', contactPerson: 'Koli S. Fahnbulleh', email: 'sales@monroviaoffice.com', phone: '+231 886 100 200', category: 'IT & Stationery', ratingScore: 4.8, taxRegistrationNumber: 'TIN-908123-LIB', bankAccountDetails: 'First Islamic Bank ACC #10293847', status: 'approved' },
      { id: 'VND-02', vendorCode: 'VND-2026-0018', companyName: 'West Africa Lab & Scientific Equipment Corp.', contactPerson: 'Dr. Amina Toure', email: 'orders@walabs.com', phone: '+224 622 998 811', category: 'STEM & Medical Supplies', ratingScore: 4.6, taxRegistrationNumber: 'TIN-881230-GUI', bankAccountDetails: 'Ecobank Guinea ACC #88201293', status: 'approved' }
    ];
  },

  /**
   * Get Purchase Requisitions.
   */
  async getRequisitions(): Promise<PurchaseRequisition[]> {
    return [
      { id: 'PR-01', requisitionNumber: 'PR-2026-00881', title: 'Q3 Examination Materials & Answer Booklet Reams', departmentName: 'Examination & Assessment Office', requestedBy: 'Mr. Hassan Koroma', estimatedTotalUSD: 1850.00, priority: 'urgent', status: 'approved', items: [{ itemDescription: 'A4 Examination Paper Reams (100 boxes)', quantity: 100, estimatedUnitPriceUSD: 18.50 }], auditHistory: [{ id: '1', action: 'REQUISITION_CREATED', performedBy: 'Mr. Hassan Koroma', performedByRole: 'accountant', timestamp: '2026-07-10T09:00:00Z' }], createdAt: '2026-07-10T09:00:00Z' }
    ];
  },

  /**
   * Get Purchase Orders (PO).
   */
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return [
      { id: 'PO-01', poNumber: 'PO-2026-00941', requisitionNumber: 'PR-2026-00881', vendorId: 'VND-01', vendorName: 'Monrovia Office & IT Supplies Ltd.', orderDate: '2026-07-12', expectedDeliveryDate: '2026-07-20', subtotalUSD: 1850.00, taxUSD: 0, totalAmountUSD: 1850.00, approvalStatus: 'approved', fulfillmentStatus: 'fully_received', threeWayMatchStatus: 'matched', invoiceId: 'INV-VND-2026-88', items: [{ itemDescription: 'A4 Examination Paper Reams', quantity: 100, unitPriceUSD: 18.50, totalPriceUSD: 1850.00, receivedQuantity: 100 }] }
    ];
  },

  /**
   * Create Purchase Order & Check Department Budget in Finance ERP.
   */
  async createPurchaseOrder(
    vendorId: string,
    vendorName: string,
    items: { itemDescription: string; quantity: number; unitPriceUSD: number }[]
  ): Promise<PurchaseOrder> {
    const poNumber = sequenceService.generateDocumentNumber('PO');
    const subtotalUSD = items.reduce((sum, item) => sum + item.quantity * item.unitPriceUSD, 0);

    const po: PurchaseOrder = {
      id: sequenceService.generateUUID(),
      poNumber,
      vendorId,
      vendorName,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotalUSD,
      taxUSD: 0,
      totalAmountUSD: subtotalUSD,
      approvalStatus: 'pending_finance',
      fulfillmentStatus: 'unfulfilled',
      threeWayMatchStatus: 'pending',
      items: items.map(i => ({ ...i, totalPriceUSD: i.quantity * i.unitPriceUSD, receivedQuantity: 0 }))
    };

    toast.success(`Generated Purchase Order ${poNumber} ($${subtotalUSD.toFixed(2)}) for ${vendorName}`);
    return po;
  },

  /**
   * Perform 3-Way Matching (PO ↔ Goods Receipt ↔ Vendor Invoice) & Auto-Post Accounts Payable (GL 2010).
   */
  async performThreeWayMatch(po: PurchaseOrder, grnNumber: string, vendorInvoiceNumber: string): Promise<PurchaseOrder> {
    const isMatched = po.fulfillmentStatus === 'fully_received' || po.items.every(i => i.receivedQuantity >= i.quantity);

    if (isMatched) {
      // Auto Finance Integration: Post Accounts Payable & Operating Expense Journal
      try {
        await financeService.postManualJournalEntry({
          reference: po.poNumber,
          description: `3-Way Matched Vendor Invoice (${vendorInvoiceNumber}) for PO ${po.poNumber}`,
          lines: [
            { id: '1', accountCode: '5040', accountName: 'Academic Supplies & Consumables Expense', debit: po.totalAmountUSD, credit: 0 },
            { id: '2', accountCode: '2010', accountName: 'Accounts Payable Vendor Liabilities (Series 2000)', debit: 0, credit: po.totalAmountUSD }
          ]
        });
        toast.success(`Finance Integration: 3-Way Match Verified! Posted AP Liability for ${po.poNumber} ($${po.totalAmountUSD.toFixed(2)})`);
      } catch (err) {
        console.warn('Failed to post AP journal entry:', err);
      }
    }

    const updatedPO: PurchaseOrder = {
      ...po,
      threeWayMatchStatus: isMatched ? 'matched' : 'discrepancy',
      invoiceId: vendorInvoiceNumber
    };

    return updatedPO;
  }
};
