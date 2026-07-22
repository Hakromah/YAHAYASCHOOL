'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Truck, CheckCircle2, AlertCircle, Plus, Eye, FileCheck, Layers, DollarSign
} from 'lucide-react';
import { procurementService } from '@/services/procurement.service';
import type { Vendor, PurchaseRequisition, PurchaseOrder } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ProcurementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, pr, po] = await Promise.all([
        procurementService.getVendors(),
        procurementService.getRequisitions(),
        procurementService.getPurchaseOrders()
      ]);
      setVendors(v);
      setRequisitions(pr);
      setPurchaseOrders(po);
    } catch {
      toast.error('Failed to load procurement & PO data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      return !query || 
        po.poNumber.toLowerCase().includes(query.toLowerCase()) || 
        po.vendorName.toLowerCase().includes(query.toLowerCase()) ||
        po.fulfillmentStatus.toLowerCase().includes(query.toLowerCase());
    });
  }, [purchaseOrders, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmountUSD, 0);
    const matchedCount = purchaseOrders.filter(po => po.threeWayMatchStatus === 'matched').length;

    return [
      {
        id: 'approved_vendors',
        title: 'Approved Vendors & Suppliers',
        value: `${vendors.length} Vendors`,
        subtitle: 'Verified Tax & Bank Registration',
        trendDirection: 'up',
        icon: <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'purchase_orders',
        title: 'Active Purchase Orders (PO)',
        value: `${totalPOs} Orders`,
        subtitle: `$${totalPOAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Total Value`,
        trendDirection: 'up',
        icon: <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'three_way_match',
        title: '3-Way Match Verified (PO ↔ GRN)',
        value: `${matchedCount} Matched`,
        subtitle: 'AP Liabilities Posted to GL 2010',
        trendDirection: 'up',
        icon: <CheckCircle2 className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'requisitions',
        title: 'Purchase Requisitions (PR)',
        value: `${requisitions.length} Requests`,
        subtitle: 'Department budget checks verified',
        trendDirection: 'neutral',
        icon: <FileCheck className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [vendors, purchaseOrders, requisitions]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'poNumber',
        header: 'PO Number & Vendor',
        cell: ({ row }) => {
          const po = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{po.poNumber}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {po.vendorName}
              </p>
              <span className="text-xs text-slate-500">Requisition: {po.requisitionNumber || 'Direct PO'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'orderDate',
        header: 'Order / Delivery Date',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold block">{row.original.orderDate}</span>
            <span className="font-mono text-[11px] text-slate-500">Exp: {row.original.expectedDeliveryDate}</span>
          </div>
        )
      },
      {
        accessorKey: 'totalAmountUSD',
        header: 'Total Order Value',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
            ${row.original.totalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        accessorKey: 'threeWayMatchStatus',
        header: '3-Way Match & AP',
        cell: ({ row }) => (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${row.original.threeWayMatchStatus === 'matched' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <CheckCircle2 className="w-3 h-3" />
            {row.original.threeWayMatchStatus.toUpperCase()}
          </span>
        )
      },
      {
        accessorKey: 'approvalStatus',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const po = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRow(po);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Inspect
              </button>
              {po.threeWayMatchStatus !== 'matched' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await procurementService.performThreeWayMatch(po, 'GRN-2026-0031', 'INV-VND-2026-88');
                    loadData();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs"
                >
                  3-Way Match
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
      title="Procurement & Accounts Payable ERP"
      description="Vendor relationship portal, Purchase Orders (PO), Requisitions, 3-Way Matching (PO ↔ GRN ↔ Vendor Invoice), and automatic Accounts Payable (GL 2010) posting."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Procurement' }]}
      icon={<ShoppingBag className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredOrders.length}
      recordLabel="Purchase Orders"
      onClearFilters={() => setQuery('')}
      headerActions={
        <button
          onClick={async () => {
            await procurementService.createPurchaseOrder('VND-01', 'Monrovia Office & IT Supplies Ltd.', [
              { itemDescription: 'Dell UltraSharp 27-inch Monitors for Computer Lab 2', quantity: 5, unitPriceUSD: 280.00 }
            ]);
            loadData();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Create Purchase Order</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search POs by PO number, vendor name, fulfillment status..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
      />

      <EnterpriseDataGrid
        data={filteredOrders}
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
          name: selectedRow.poNumber,
          id: selectedRow.poNumber,
          role: `Vendor: ${selectedRow.vendorName}`,
          status: selectedRow.approvalStatus,
          email: selectedRow.orderDate,
          balance: `$${selectedRow.totalAmountUSD.toFixed(2)} Total PO Value`
        } : null}
        category="procurement"
      />
    </EnterpriseModuleShell>
  );
}
