'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, BookCheck, QrCode, Plus, Eye, BookPlus, RotateCcw, AlertTriangle, FileText
} from 'lucide-react';
import { libraryService } from '@/services/library.service';
import type { LibraryBook, LibraryBorrowRecord } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function LibraryPage() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<LibraryBorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, r] = await Promise.all([
        libraryService.getBooks(),
        libraryService.getBorrowRecords()
      ]);
      setBooks(b);
      setBorrowRecords(r);
    } catch {
      toast.error('Failed to load library catalog data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    return borrowRecords.filter(r => {
      return !query || 
        r.bookTitle.toLowerCase().includes(query.toLowerCase()) || 
        r.borrowerName.toLowerCase().includes(query.toLowerCase()) ||
        r.isbn.includes(query) ||
        r.borrowNumber.toLowerCase().includes(query.toLowerCase());
    });
  }, [borrowRecords, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const totalBorrowed = borrowRecords.filter(r => r.status === 'issued' || r.status === 'overdue').length;
    const totalOverdueFines = borrowRecords.reduce((sum, r) => sum + (r.finePaid ? 0 : r.fineAmount), 0);

    return [
      {
        id: 'total_catalog',
        title: 'Academic Library Catalog',
        value: `${totalTitles} Titles`,
        subtitle: `${totalCopies} Total Physical & Digital Copies`,
        trendDirection: 'up',
        icon: <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'active_borrows',
        title: 'Active Borrowed Books',
        value: totalBorrowed.toString(),
        subtitle: 'Currently in circulation among scholars & faculty',
        trendDirection: 'neutral',
        icon: <BookCheck className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'digital_books',
        title: 'Digital PDF Resources',
        value: books.filter(b => b.isDigital).length.toString(),
        subtitle: 'Accessible via Student & Teacher Portals',
        trendDirection: 'up',
        icon: <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'overdue_fines',
        title: 'Outstanding Overdue Fines',
        value: `$${totalOverdueFines.toFixed(2)}`,
        subtitle: 'Auto-posted to Finance ERP (GL 4030)',
        trendDirection: 'down',
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [books, borrowRecords]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'borrowNumber',
        header: 'Borrow ID & Book Title',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{r.borrowNumber}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {r.bookTitle}
              </p>
              <span className="font-mono text-xs text-slate-500">ISBN: {r.isbn}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'borrowerName',
        header: 'Borrower',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.borrowerName}</span>
            <span className="text-[11px] text-slate-500 capitalize">{row.original.borrowerType} Profile</span>
          </div>
        )
      },
      {
        accessorKey: 'issueDate',
        header: 'Issue / Due Date',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold block">{row.original.issueDate}</span>
            <span className={`font-mono text-xs font-bold ${row.original.status === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
              Due: {row.original.dueDate}
            </span>
          </div>
        )
      },
      {
        accessorKey: 'fineAmount',
        header: 'Overdue Fine',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <span className={`font-mono text-xs font-extrabold ${r.fineAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                ${r.fineAmount.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400 block">{r.finePaid ? 'Settled (GL 4030)' : 'Unpaid'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Circulation Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRow(r);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Inspect
              </button>
              {r.status !== 'returned' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await libraryService.returnBook(r, true);
                    loadData();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Return Book
                </button>
              )}
            </div>
          );
        }
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Academic Library ERP & Circulation Desk"
      description="Integrated ISBN book cataloging, barcode/QR circulation desk, digital PDF library access, and automated overdue fine settlement via Finance ERP."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Library System' }]}
      icon={<BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredRecords.length}
      recordLabel="Borrow Records"
      onClearFilters={() => setQuery('')}
      headerActions={
        <button
          onClick={async () => {
            await libraryService.issueBook('BK-02', 'Campbell Biology (11th Global Edition)', '978-0134083186', 'Mariama Diallo', 'student');
            loadData();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Issue Book</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search circulation desk by book title, ISBN, borrower name, ID..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
      />

      <EnterpriseDataGrid
        data={filteredRecords}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
      />

      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          ...selectedRow,
          name: selectedRow.bookTitle,
          id: selectedRow.borrowNumber,
          role: `Borrower: ${selectedRow.borrowerName}`,
          status: selectedRow.status,
          email: `ISBN ${selectedRow.isbn}`,
          balance: `$${selectedRow.fineAmount.toFixed(2)} Fine (${selectedRow.finePaid ? 'PAID' : 'PENDING'})`
        } : null}
        category="library"
      />
    </EnterpriseModuleShell>
  );
}
