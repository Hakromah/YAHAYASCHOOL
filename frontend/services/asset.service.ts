import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type { FixedAsset, DepreciationScheduleItem } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Fixed Asset Management ERP Service
// Integrated Fixed Asset Register, Depreciation Engine & GL Journal Posting
// ─────────────────────────────────────────────────────────────────────────────

export const assetService = {
  /**
   * Get all Fixed Assets in Register.
   */
  async getAssets(): Promise<FixedAsset[]> {
    return [
      { id: 'AST-01', assetTag: 'AST-2026-00412', name: 'Dell PowerEdge R750 Rack Server (Primary ERP Server)', category: 'IT & Computers', purchaseDate: '2025-08-10', purchaseCostUSD: 8500.00, salvageValueUSD: 500.00, usefulLifeYears: 5, currentBookValueUSD: 6900.00, accumulatedDepreciationUSD: 1600.00, depreciationMethod: 'Straight Line', location: 'Data Center Server Room', assignedDepartment: 'IT Infrastructure & Operations', barcode: '9900000000101', status: 'active' },
      { id: 'AST-02', assetTag: 'AST-2026-00415', name: 'Physics & STEM High-Precision Spectrometer', category: 'Lab Equipment', purchaseDate: '2026-01-15', purchaseCostUSD: 12400.00, salvageValueUSD: 1000.00, usefulLifeYears: 7, currentBookValueUSD: 10771.00, accumulatedDepreciationUSD: 1629.00, depreciationMethod: 'Straight Line', location: 'Science Wing Lab 302', assignedDepartment: 'Science & STEM Department', barcode: '9900000000104', status: 'active' },
      { id: 'AST-03', assetTag: 'AST-2026-00420', name: 'Toyota Coaster 30-Seater Campus Bus', category: 'Vehicles & Transport', purchaseDate: '2024-05-20', purchaseCostUSD: 45000.00, salvageValueUSD: 5000.00, usefulLifeYears: 8, currentBookValueUSD: 35000.00, accumulatedDepreciationUSD: 10000.00, depreciationMethod: 'Straight Line', location: 'Campus Fleet Garage', assignedDepartment: 'Transport Logistics', barcode: '9900000000108', status: 'active' }
    ];
  },

  /**
   * Register a New Fixed Asset & Post Asset Capitalization Journal Entry.
   */
  async registerAsset(payload: Partial<FixedAsset>): Promise<FixedAsset> {
    const assetTag = sequenceService.generateDocumentNumber('AST');
    const cost = payload.purchaseCostUSD || 1000.00;
    const salvage = payload.salvageValueUSD || 100.00;
    const life = payload.usefulLifeYears || 5;

    const newAsset: FixedAsset = {
      id: sequenceService.generateUUID(),
      assetTag,
      name: payload.name || 'New Institutional Asset',
      category: payload.category || 'IT & Computers',
      purchaseDate: payload.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseCostUSD: cost,
      salvageValueUSD: salvage,
      usefulLifeYears: life,
      currentBookValueUSD: cost,
      accumulatedDepreciationUSD: 0,
      depreciationMethod: payload.depreciationMethod || 'Straight Line',
      location: payload.location || 'Central Campus',
      assignedDepartment: payload.assignedDepartment || 'Campus Operations',
      assignedStaffName: payload.assignedStaffName,
      barcode: `99000${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: 'active'
    };

    // Auto Finance Integration: Post Asset Capitalization GL Journal Entry
    try {
      await financeService.postManualJournalEntry({
        reference: assetTag,
        description: `Fixed Asset Capitalization: ${newAsset.name}`,
        lines: [
          { id: '1', accountCode: '1500', accountName: 'Property, Plant & Equipment Assets (Series 1500)', debit: cost, credit: 0 },
          { id: '2', accountCode: '1010', accountName: 'Commercial Bank Treasury', debit: 0, credit: cost }
        ]
      });
      toast.success(`Finance Integration: Posted Capitalization Journal for ${assetTag} ($${cost.toFixed(2)})`);
    } catch (err) {
      console.warn('Failed to post asset capitalization journal:', err);
    }

    toast.success(`Registered Fixed Asset ${assetTag}: ${newAsset.name}`);
    return newAsset;
  },

  /**
   * Generate Depreciation Schedule & Post Monthly Depreciation Journal.
   */
  async runDepreciationSchedule(asset: FixedAsset): Promise<{ schedule: DepreciationScheduleItem[]; monthlyDepreciation: number }> {
    const depreciableBase = asset.purchaseCostUSD - asset.salvageValueUSD;
    const annualDepreciation = depreciableBase / Math.max(1, asset.usefulLifeYears);
    const monthlyDepreciation = Number((annualDepreciation / 12).toFixed(2));

    const schedule: DepreciationScheduleItem[] = [];
    let currentBookValue = asset.purchaseCostUSD;
    let accumDep = 0;

    for (let yr = 1; yr <= asset.usefulLifeYears; yr++) {
      const depAmt = Number(annualDepreciation.toFixed(2));
      accumDep += depAmt;
      currentBookValue -= depAmt;
      schedule.push({
        year: yr,
        periodName: `Year ${yr} (${2026 + yr - 1})`,
        beginningBookValueUSD: currentBookValue + depAmt,
        depreciationAmountUSD: depAmt,
        endingBookValueUSD: Math.max(asset.salvageValueUSD, currentBookValue),
        accumulatedDepreciationUSD: accumDep,
        isPosted: yr === 1
      });
    }

    // Auto Finance Integration: Post Monthly Depreciation Journal Entry
    try {
      await financeService.postManualJournalEntry({
        reference: `DEP-${asset.assetTag}`,
        description: `Monthly Depreciation Expense for ${asset.name} (${asset.assetTag})`,
        lines: [
          { id: '1', accountCode: '5030', accountName: 'Asset Depreciation & Maintenance Expense', debit: monthlyDepreciation, credit: 0 },
          { id: '2', accountCode: '1500', accountName: 'Accumulated Depreciation contra-Asset', debit: 0, credit: monthlyDepreciation }
        ]
      });
      toast.success(`Finance Integration: Posted Monthly Depreciation Journal ($${monthlyDepreciation.toFixed(2)}/mo)`);
    } catch (err) {
      console.warn('Failed to post depreciation journal:', err);
    }

    return { schedule, monthlyDepreciation };
  }
};
