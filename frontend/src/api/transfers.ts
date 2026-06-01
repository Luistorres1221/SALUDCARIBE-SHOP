import { apiClient } from "./client";

export type TransferStatus =
  | "PENDIENTE"
  | "APROBADO"
  | "RECHAZADO"
  | "DESPACHADO"
  | "RECIBIDO";

export interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  dispatchedQuantity?: number;
  receivedQuantity?: number;
}

export interface Transfer {
  id: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  requestedBy?: string;
  requestedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  dispatchedBy?: string;
  dispatchedByName?: string;
  receivedBy?: string;
  receivedByName?: string;
  status: TransferStatus;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  items: TransferItem[];
}

export interface CreateTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  notes?: string;
  items: { productId: string; requestedQuantity: number }[];
}

export interface ApproveTransferRequest {
  adminNotes?: string;
  items?: { itemId: string; approvedQuantity: number }[];
}

export const transfersApi = {
  getAll: (): Promise<Transfer[]> =>
    apiClient.get("/api/admin/transfers").then((r) => r.data),

  getById: (id: string): Promise<Transfer> =>
    apiClient.get(`/api/admin/transfers/${id}`).then((r) => r.data),

  getMine: (): Promise<Transfer[]> =>
    apiClient.get("/api/transfers/mine").then((r) => r.data),

  create: (req: CreateTransferRequest): Promise<Transfer> =>
    apiClient.post("/api/transfers", req).then((r) => r.data),

  approve: (id: string, req: ApproveTransferRequest): Promise<Transfer> =>
    apiClient.post(`/api/admin/transfers/${id}/approve`, req).then((r) => r.data),

  reject: (id: string, adminNotes?: string): Promise<Transfer> =>
    apiClient.post(`/api/admin/transfers/${id}/reject`, { adminNotes }).then((r) => r.data),

  dispatch: (id: string): Promise<Transfer> =>
    apiClient.post(`/api/admin/transfers/${id}/dispatch`).then((r) => r.data),

  receive: (id: string): Promise<Transfer> =>
    apiClient.post(`/api/transfers/${id}/receive`).then((r) => r.data),
};
