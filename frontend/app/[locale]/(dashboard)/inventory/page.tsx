'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Warehouse, ArrowUpRight, ArrowDownLeft, Plus, Eye, Layers, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { inventoryService } from '@/services/inventory.service';
import type { InventoryWarehouse, InventoryItem, InventoryMovement } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<InventoryWarehouse[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [w, i, m] = await Promise.all([
        inventoryService.getWarehouses(),
        inventoryService.getItems(),
        inventoryService.getMovements()
      ]);
      setWarehouses(w);
      setItems(i);
      setMovements(m);
    } catch {
      toast.error('Failed to load inventory stock data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return !query || 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.itemCode.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.warehouseName.toLowerCase().includes(query.toLowerCase());
    });
  }, [items, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalSKUs = items.length;
    const totalValuation = items.reduce((sum, item) => sum + item.totalValueUSD, 0);
    const lowStockCount = items.filter(item => item.quantityOnHand <= item.minimumReorderLevel).length;

    return [
      {
        id: 'total_skus',
        title: 'Active Inventory SKUs',
        value: `${totalSKUs} Stock Items`,
        subtitle: `Across ${warehouses.length} Campus Warehouses`,
        trendDirection: 'up',
        icon: <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'total_valuation',
        title: 'Stock Asset Valuation (FIFO/WAC)',
        value: `$${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'Auto-Capitalized in Finance Asset Ledger (GL 1050)',
        trendDirection: 'up',
        icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'low_stock_alert',
        title: 'Low Stock Reorder Alerts',
        value: `${lowStockCount} Items`,
        subtitle: 'Below minimum safety reorder threshold',
        trendDirection: 'down',
        icon: <AlertCircle className="w-5 h-5 text-amber-500" />
      },
      {
        id: 'warehouses',
        title: 'Depots & Warehouses',
        value: `${warehouses.length} Warehouses`,
        subtitle: 'Central Logistics & STEM Lab Depots',
        trendDirection: 'neutral',
        icon: <Warehouse className="w-5 h-5 text-sky-500" />
      }
    ];
  }, [items, warehouses]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'itemCode',
        header: 'SKU & Item Name',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{item.itemCode}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {item.name}
              </p>
              <span className="text-xs text-slate-500">{item.category}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'warehouseName',
        header: 'Warehouse & Barcode',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.warehouseName}</span>
            <span className="font-mono text-[11px] text-slate-500">Barcode: {row.original.barcode}</span>
          </div>
        )
      },
      {
        accessorKey: 'quantityOnHand',
        header: 'Quantity On Hand',
        cell: ({ row }) => {
          const item = row.original;
          const isLow = item.quantityOnHand <= item.minimumReorderLevel;
          return (
            <div>
              <span className={`font-mono text-xs sm:text-sm font-extrabold ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {item.quantityOnHand} {item.unitOfMeasure}
              </span>
              <span className="text-[11px] text-slate-500 block">Min Level: {item.minimumReorderLevel} {item.unitOfMeasure}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'totalValueUSD',
        header: 'Valuation & Unit Cost',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">${row.original.totalValueUSD.toFixed(2)}</span>
            <span className="text-[11px] text-slate-500">${row.original.unitCostUSD.toFixed(2)} / unit ({row.original.valuationMethod})</span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Stock Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRow(item);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Inspect
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await inventoryService.recordStockMovement('goods_issue', item.itemCode, item.name, 5, item.unitCostUSD, item.warehouseName, 'Store Keeper');
                  loadData();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
                Issue Stock
              </button>
            </div>
          );
        }
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Inventory & Supply Chain ERP"
      description="Multi-warehouse stock levels, reorder threshold alerts, valuation engine (FIFO/WAC), and automatic COGS & Inventory Asset General Ledger entries."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Inventory' }]}
      icon={<Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredItems.length}
      recordLabel="Stock Items"
      onClearFilters={() => setQuery('')}
      headerActions={
        <button
          onClick={async () => {
            await inventoryService.recordStockMovement('goods_receipt', 'INV-SKU-1001', 'A4 Examination Paper Reams', 50, 18.50, 'Central Campus Logistics Depot', 'Logistics Officer');
            loadData();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Goods Receipt (GRN)</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search inventory by item code, SKU name, category, warehouse..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
      />

      <EnterpriseDataGrid
        data={filteredItems}
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
          name: selectedRow.name,
          id: selectedRow.itemCode,
          role: `${selectedRow.category} (${selectedRow.warehouseName})`,
          status: selectedRow.status,
          email: `Barcode: ${selectedRow.barcode}`,
          balance: `$${selectedRow.totalValueUSD.toFixed(2)} Valuation (GL 1050)`
        } : null}
        category="inventory"
      />
    </EnterpriseModuleShell>
  );
}
