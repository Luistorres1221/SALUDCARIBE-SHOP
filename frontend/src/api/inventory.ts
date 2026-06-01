import { apiClient } from "./client";

export type MovementType =
  | "ENTRADA_COMPRA"
  | "SALIDA_ENTREGA"
  | "TRASLADO_SALIDA"
  | "TRASLADO_ENTRADA"
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO"
  | "DEVOLUCION";

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  ENTRADA_COMPRA:   "Entrada por Compra",
  SALIDA_ENTREGA:   "Salida por Entrega",
  TRASLADO_SALIDA:  "Traslado Salida",
  TRASLADO_ENTRADA: "Traslado Entrada",
  AJUSTE_POSITIVO:  "Ajuste Positivo",
  AJUSTE_NEGATIVO:  "Ajuste Negativo",
  DEVOLUCION:       "Devolución",
};

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productSku: string;
  productPrice: number;
  quantity: number;
  minimumStock: number;
  lowStock: boolean;
  outOfStock: boolean;
}

export interface InventoryMovement {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productSku: string;
  type: MovementType;
  typeLabel: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface StockEntryRequest {
  warehouseId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export interface AdjustStockRequest {
  warehouseId: string;
  productId: string;
  type: MovementType;
  quantity: number;
  notes?: string;
}

export const inventoryApi = {
  getAllStock: (): Promise<WarehouseStock[]> =>
    apiClient.get("/api/admin/inventory/stock").then((r) => r.data),

  getStockByWarehouse: (warehouseId: string): Promise<WarehouseStock[]> =>
    apiClient.get(`/api/admin/inventory/stock/warehouse/${warehouseId}`).then((r) => r.data),

  getLowStock: (warehouseId: string): Promise<WarehouseStock[]> =>
    apiClient.get(`/api/admin/inventory/stock/low/${warehouseId}`).then((r) => r.data),

  getOutOfStock: (warehouseId: string): Promise<WarehouseStock[]> =>
    apiClient.get(`/api/admin/inventory/stock/out-of-stock/${warehouseId}`).then((r) => r.data),

  recordEntry: (req: StockEntryRequest): Promise<InventoryMovement> =>
    apiClient.post("/api/admin/inventory/entry", req).then((r) => r.data),

  adjustStock: (req: AdjustStockRequest): Promise<InventoryMovement> =>
    apiClient.post("/api/admin/inventory/adjust", req).then((r) => r.data),

  getKardex: (productId: string, warehouseId?: string): Promise<InventoryMovement[]> =>
    apiClient
      .get(`/api/admin/inventory/kardex/${productId}`, { params: warehouseId ? { warehouseId } : {} })
      .then((r) => r.data),

  getAllMovements: (): Promise<InventoryMovement[]> =>
    apiClient.get("/api/admin/inventory/movements").then((r) => r.data),

  getMovementsByWarehouse: (warehouseId: string): Promise<InventoryMovement[]> =>
    apiClient.get(`/api/admin/inventory/movements/warehouse/${warehouseId}`).then((r) => r.data),
};
