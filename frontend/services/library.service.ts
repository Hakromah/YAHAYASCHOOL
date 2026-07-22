import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type { LibraryBook, LibraryBorrowRecord } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Library ERP Service
// Integrated Circulation Desk, Barcode/QR Engine & Overdue Fine Finance Ledger
// ─────────────────────────────────────────────────────────────────────────────

export const libraryService = {
  /**
   * Get all Library Books in Catalog.
   */
  async getBooks(): Promise<LibraryBook[]> {
    return [
      { id: 'BK-01', isbn: '978-0198408223', title: 'Tafsir Ibn Kathir (Complete 10 Volume Set)', author: 'Imam Hafiz Ibn Kathir', publisher: 'Darussalam Publications', category: 'Islamic Studies', totalCopies: 8, availableCopies: 5, borrowedCopies: 3, rackLocation: 'Rack IS-04', isDigital: true, pdfUrl: '/digital-library/tafsir.pdf' },
      { id: 'BK-02', isbn: '978-0134083186', title: 'Campbell Biology (11th Global Edition)', author: 'Lisa A. Urry et al.', publisher: 'Pearson Education', category: 'STEM & Sciences', totalCopies: 15, availableCopies: 11, borrowedCopies: 4, rackLocation: 'Rack ST-08', isDigital: false },
      { id: 'BK-03', isbn: '978-0141040349', title: 'Arabic Grammar in Use & Morphology', author: 'Dr. V. Abdur Rahim', publisher: 'Madinah University Press', category: 'Languages', totalCopies: 20, availableCopies: 18, borrowedCopies: 2, rackLocation: 'Rack AR-02', isDigital: true, pdfUrl: '/digital-library/arabic-grammar.pdf' }
    ];
  },

  /**
   * Get Borrowing History Records.
   */
  async getBorrowRecords(): Promise<LibraryBorrowRecord[]> {
    return [
      { id: 'BR-01', borrowNumber: 'LIB-2026-00120', bookId: 'BK-01', bookTitle: 'Tafsir Ibn Kathir (Complete 10 Volume Set)', isbn: '978-0198408223', borrowerId: '1', borrowerName: 'Tariq Ibrahim Mansour', borrowerType: 'student', issueDate: '2026-07-01', dueDate: '2026-07-15', returnDate: undefined, status: 'overdue', fineAmount: 15.00, finePaid: false }
    ];
  },

  /**
   * Issue / Borrow a Book.
   */
  async issueBook(bookId: string, bookTitle: string, isbn: string, borrowerName: string, borrowerType: 'student' | 'teacher' | 'worker'): Promise<LibraryBorrowRecord> {
    const borrowNum = sequenceService.generateDocumentNumber('LIB');
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 14); // 14-day borrowing period
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const record: LibraryBorrowRecord = {
      id: sequenceService.generateUUID(),
      borrowNumber: borrowNum,
      bookId,
      bookTitle,
      isbn,
      borrowerId: '1',
      borrowerName,
      borrowerType,
      issueDate,
      dueDate,
      status: 'issued',
      fineAmount: 0,
      finePaid: false
    };

    toast.success(`Issued '${bookTitle}' to ${borrowerName}. Due Date: ${dueDate}`);
    return record;
  },

  /**
   * Process Return & Settle Overdue Fine in Finance ERP.
   */
  async returnBook(record: LibraryBorrowRecord, finePaid = false): Promise<LibraryBorrowRecord> {
    const returnDate = new Date().toISOString().split('T')[0];

    if (record.fineAmount > 0 && finePaid) {
      try {
        await financeService.postPaymentReceipt({
          paymentAmount: record.fineAmount,
          paymentMethod: 'Cash',
          paymentDate: new Date().toISOString(),
          cashierName: 'Library Circulation Desk',
          paymentType: 'Library Overdue Fine'
        });
        toast.success(`Finance Integration: Overdue Fine Receipt created for $${record.fineAmount.toFixed(2)} (GL 4030)`);
      } catch (err) {
        console.warn('Failed to record library fine receipt:', err);
      }
    }

    const updated: LibraryBorrowRecord = {
      ...record,
      returnDate,
      status: 'returned',
      finePaid: finePaid || record.fineAmount === 0
    };

    toast.success(`Book '${record.bookTitle}' returned successfully.`);
    return updated;
  }
};
