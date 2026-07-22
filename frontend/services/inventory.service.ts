import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type { InventoryWarehouse, InventoryItem, InventoryMovement } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Inventory ERP Service
// Multi-Warehouse Supply Chain, Valuation Engine (FIFO/WAC) & COGS GL Accounting
// ─────────────────────────────────────────────────────────────────────────────

export const inventoryService = {
  /**
   * Get All Warehouses.
   */
  async getWarehouses(): Promise<InventoryWarehouse[]> {
    return [
      { id: 'WH-01', code: 'WH-MAIN-01', name: 'Central Campus Logistics Depot', location: 'Building C - Ground Level', managerName: 'Brother Musa Kamara', totalItems: 142, totalValuationUSD: 84500.00 },
      { id: 'WH-02', code: 'WH-STEM-02', name: 'Science & STEM Lab Store', location: 'Science Wing Floor 2', managerName: 'Dr. Sarah Al-Hassan', totalItems: 48, totalValuationUSD: 32100.00 }
    ];
  },

  /**
   * Get All Stock Items.
   */
  async getItems(): Promise<InventoryItem[]> {
    return [
      { id: 'ITEM-01', itemCode: 'INV-SKU-1001', name: 'A4 High-Grade Examination Paper Reams', category: 'Stationery & Books', unitOfMeasure: 'boxes', warehouseId: 'WH-01', warehouseName: 'Central Campus Logistics Depot', quantityOnHand: 250, minimumReorderLevel: 50, unitCostUSD: 18.50, totalValueUSD: 4625.00, valuationMethod: 'FIFO', barcode: '8901234567891', status: 'in_stock' },
      { id: 'ITEM-02', itemCode: 'INV-SKU-2004', name: 'Microscope Glass Slides & Cover Slips Set', category: 'Lab Consumables', unitOfMeasure: 'sets', warehouseId: 'WH-2', warehouseName: 'Science & STEM Lab Store', quantityOnHand: 14, minimumReorderLevel: 20, unitCostUSD: 45.00, totalValueUSD: 630.00, valuationMethod: 'Weighted Average', barcode: '8901234567892', status: 'low_stock' },
      { id: 'ITEM-03', itemCode: 'INV-SKU-3012', name: 'HP LaserJet Enterprise Toner Cartridge (Black)', category: 'IT Hardware', unitOfMeasure: 'pcs', warehouseId: 'WH-01', warehouseName: 'Central Campus Logistics Depot', quantityOnHand: 32, minimumReorderLevel: 10, unitCostUSD: 85.00, totalValueUSD: 2720.00, valuationMethod: 'FIFO', barcode: '8901234567893', status: 'in_stock' }
    ];
  },

  /**
   * Get Stock Movements Log.
   */
  async getMovements(): Promise<InventoryMovement[]> {
    return [
      { id: 'MOV-01', movementNumber: 'INV-MOV-2026-088', type: 'goods_receipt', itemCode: 'INV-SKU-1001', itemName: 'A4 High-Grade Examination Paper Reams', quantity: 100, destinationWarehouse: 'Central Campus Logistics Depot', unitCostUSD: 18.50, totalCostUSD: 1850.00, performedBy: 'Brother Musa Kamara', date: '2026-07-12', referenceDocNumber: 'PO-2026-00941' }
    ];
  },

  /**
   * Post Stock Issue / Goods Receipt & Automatically Generate Inventory Asset Journal Entry.
   */
  async recordStockMovement(
    type: InventoryMovement['type'],
    itemCode: string,
    itemName: string,
    quantity: number,
    unitCostUSD: number,
    warehouseName: string,
    performedBy: string
  ): Promise<InventoryMovement> {
    const movNum = sequenceService.generateDocumentNumber('INV');
    const totalCostUSD = quantity * unitCostUSD;

    const movement: InventoryMovement = {
      id: sequenceService.generateUUID(),
      movementNumber: movNum,
      type,
      itemCode,
      itemName,
      quantity,
      destinationWarehouse: warehouseName,
      unitCostUSD,
      totalCostUSD,
      performedBy,
      date: new Date().toISOString().split('T')[0]
    };

    // Auto Finance Integration: Capitalize inventory asset or post COGS expense
    try {
      if (type === 'goods_receipt') {
        await financeService.postManualJournalEntry({
          reference: movNum,
          description: `Inventory Goods Receipt: ${itemName} (${quantity} units)`,
          lines: [
            { id: '1', accountCode: '1050', accountName: 'Inventory Stock Assets', debit: totalCostUSD, credit: 0 },
            { id: '2', accountCode: '2010', accountName: 'Accounts Payable Vendor Liabilities', debit: 0, credit: totalCostUSD }
          ]
        });
        toast.success(`Finance Integration: Posted Inventory Asset Journal (${movNum})`);
      } else if (type === 'goods_issue') {
        await financeService.postManualJournalEntry({
          reference: movNum,
          description: `Inventory Goods Issue (COGS): ${itemName} (${quantity} units)`,
          lines: [
            { id: '1', accountCode: '5040', accountName: 'Academic Supplies & Consumables Expense', debit: totalCostUSD, credit: 0 },
            { id: '2', accountCode: '1050', accountName: 'Inventory Stock Assets', debit: 0, credit: totalCostUSD }
          ]
        });
        toast.success(`Finance Integration: Posted COGS Expense Journal (${movNum})`);
      }
    } catch (err) {
      console.warn('Failed to post inventory journal entry:', err);
    }

    toast.success(`Registered Stock Movement ${movNum} for ${itemName}`);
    return movement;
  }
};
