import { apiClient } from "./client";

export type InternalOrderStatus =
  | "PENDIENTE"
  | "APROBADO"
  | "ENTREGADO"
  | "CANCELADO";

export interface InternalOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPrice?: number;
  requestedQuantity: number;
  approvedQuantity?: number;
  deliveredQuantity?: number;
}

export interface InternalOrder {
  id: string;
  warehouseId: string;
  warehouseName: string;
  areaName: string;
  requestedBy?: string;
  requestedByName?: string;
  requestedByEmail?: string;
  approvedBy?: string;
  approvedByName?: string;
  deliveredBy?: string;
  deliveredByName?: string;
  receivedByName?: string;
  status: InternalOrderStatus;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
  deliveredAt?: string;
  items: InternalOrderItem[];
}

export interface CreateInternalOrderRequest {
  warehouseId: string;
  areaName: string;
  notes?: string;
  items: { productId: string; requestedQuantity: number }[];
}

export interface ApproveInternalOrderRequest {
  adminNotes?: string;
  items?: { itemId: string; approvedQuantity: number }[];
}

export interface DeliverInternalOrderRequest {
  receivedByName: string;
  notes?: string;
}

export const internalOrdersApi = {
  getAll: (): Promise<InternalOrder[]> =>
    apiClient.get("/api/admin/internal-orders").then((r) => r.data),

  getById: (id: string): Promise<InternalOrder> =>
    apiClient.get(`/api/admin/internal-orders/${id}`).then((r) => r.data),

  getMine: (): Promise<InternalOrder[]> =>
    apiClient.get("/api/internal-orders/mine").then((r) => r.data),

  create: (req: CreateInternalOrderRequest): Promise<InternalOrder> =>
    apiClient.post("/api/internal-orders", req).then((r) => r.data),

  approve: (id: string, req: ApproveInternalOrderRequest): Promise<InternalOrder> =>
    apiClient.post(`/api/admin/internal-orders/${id}/approve`, req).then((r) => r.data),

  deliver: (id: string, req: DeliverInternalOrderRequest): Promise<InternalOrder> =>
    apiClient.post(`/api/admin/internal-orders/${id}/deliver`, req).then((r) => r.data),

  cancel: (id: string): Promise<InternalOrder> =>
    apiClient.post(`/api/admin/internal-orders/${id}/cancel`).then((r) => r.data),
};
