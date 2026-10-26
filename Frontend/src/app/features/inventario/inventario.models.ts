

export const INVENTORY_STATUSES = ['available', 'low-stock', 'out-of-stock'] as const;
export type InventoryCategory = string;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];
export type InventorySort = 'name-asc' | 'price-asc' | 'price-desc' | 'stock-asc';
export type InventoryEditorMode = 'create' | 'edit' | 'view';

export interface InventoryProduct {
  id: string;
  name: string;
  category: InventoryCategory;
  price: number;
  wholesalePrice: number;
  bulkPrice: number;
  imageUrl?: string;
  quantity: number;
  minimumStock: number;
  status: InventoryStatus;
  description: string;
}

export interface InventoryFilters {
  search: string;
  category: InventoryCategory | 'Todas';
  status: InventoryStatus | 'Todos';
  sort: InventorySort;
}

export interface InventorySummary {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  estimatedValue: number;
}

export interface InventoryFormValue {
  name: string;
  category: InventoryCategory;
  price: number;
  wholesalePrice: number;
  bulkPrice: number;
  quantity: number;
  minimumStock: number;
  description: string;
}
