'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark, QrCode, TrendingDown, Plus, Eye, Calculator, Calendar, ShieldCheck, FileText
} from 'lucide-react';
import { assetService } from '@/services/asset.service';
import type { FixedAsset } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await assetService.getAssets();
      setAssets(data);
    } catch {
      toast.error('Failed to load fixed asset register.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      return !query || 
        asset.name.toLowerCase().includes(query.toLowerCase()) || 
        asset.assetTag.toLowerCase().includes(query.toLowerCase()) ||
        asset.category.toLowerCase().includes(query.toLowerCase()) ||
        asset.location.toLowerCase().includes(query.toLowerCase());
    });
  }, [assets, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalCount = assets.length;
    const totalCost = assets.reduce((sum, a) => sum + a.purchaseCostUSD, 0);
    const totalBookValue = assets.reduce((sum, a) => sum + a.currentBookValueUSD, 0);
    const totalAccumDep = assets.reduce((sum, a) => sum + a.accumulatedDepreciationUSD, 0);

    return [
      {
        id: 'total_assets',
        title: 'Fixed Asset Register',
        value: `${totalCount} Tagged Assets`,
        subtitle: 'Buildings, IT, Vehicles, & Science Labs',
        trendDirection: 'up',
        icon: <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'purchase_cost',
        title: 'Original Asset Cost (Series 1500)',
        value: `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'Capitalized in Finance General Ledger',
        trendDirection: 'up',
        icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'book_value',
        title: 'Net Book Value (NBV)',
        value: `$${totalBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'Current Net Carrying Value on Balance Sheet',
        trendDirection: 'neutral',
        icon: <ShieldCheck className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'accum_depreciation',
        title: 'Accumulated Depreciation',
        value: `$${totalAccumDep.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'Monthly Depreciation GL Posting (GL 5030)',
        trendDirection: 'down',
        icon: <TrendingDown className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [assets]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'assetTag',
        header: 'Asset Tag & Name',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{a.assetTag}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {a.name}
              </p>
              <span className="text-xs text-slate-500">{a.category}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'location',
        header: 'Location & Department',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.location}</span>
            <span className="text-[11px] text-slate-500">{row.original.assignedDepartment || 'General Campus'}</span>
          </div>
        )
      },
      {
        accessorKey: 'purchaseCostUSD',
        header: 'Purchase Cost & Date',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white block">${row.original.purchaseCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="font-mono text-[11px] text-slate-500">{row.original.purchaseDate}</span>
          </div>
        )
      },
      {
        accessorKey: 'currentBookValueUSD',
        header: 'Net Book Value (NBV)',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">${row.original.currentBookValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[11px] text-slate-500">Dep: ${row.original.accumulatedDepreciationUSD.toFixed(2)}</span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRow(a);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Inspect
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await assetService.runDepreciationSchedule(a);
                  loadData();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs"
              >
                <Calculator className="w-3.5 h-3.5 inline mr-1" />
                Run Dep
              </button>
            </div>
          );
        }
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Fixed Asset Management ERP"
      description="Enterprise fixed asset register, QR/Barcode tagging, life-cycle tracking, location assignments, and automated monthly depreciation journal postings."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Fixed Assets' }]}
      icon={<Landmark className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredAssets.length}
      recordLabel="Fixed Assets"
      onClearFilters={() => setQuery('')}
      headerActions={
        <button
          onClick={async () => {
            await assetService.registerAsset({
              name: 'Smart Interactive Touchscreen Display (Grade 8 STEM Lab)',
              category: 'IT & Computers',
              purchaseCostUSD: 3200.00,
              salvageValueUSD: 200.00,
              usefulLifeYears: 5,
              location: 'Science Wing Lab 2',
              assignedDepartment: 'STEM Department'
            });
            loadData();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Register Asset</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search fixed assets by asset tag, name, category, location..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
      />

      <EnterpriseDataGrid
        data={filteredAssets}
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
          id: selectedRow.assetTag,
          role: `${selectedRow.category} (${selectedRow.location})`,
          status: selectedRow.status,
          email: `Barcode: ${selectedRow.barcode}`,
          balance: `$${selectedRow.currentBookValueUSD.toFixed(2)} Net Book Value`
        } : null}
        category="asset"
      />
    </EnterpriseModuleShell>
  );
}
