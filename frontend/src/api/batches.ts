import { apiClient } from "./client";

export type BatchStatus = "vigente" | "por_vencer" | "vencido";

export interface ProductBatch {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string | null;
  batchNumber: string;
  initialQuantity: number;
  remainingQuantity: number;
  costPerUnit: number;
  expirationDate: string; // "YYYY-MM-DD"
  receivedDate: string;   // "YYYY-MM-DD"
  active: boolean;
  createdAt: string;
  status: BatchStatus;
  totalValue: number;
}

export interface ProductBatchRequest {
  productId: string;
  batchNumber: string;
  initialQuantity: number;
  remainingQuantity: number;
  costPerUnit: number;
  expirationDate: string;
  receivedDate: string;
  active: boolean;
}

export const batchesApi = {
  listAll: () =>
    apiClient.get<ProductBatch[]>("/api/admin/batches").then((r) => r.data),

  listExpired: () =>
    apiClient.get<ProductBatch[]>("/api/admin/batches/expired").then((r) => r.data),

  listExpiringSoon: (days = 30) =>
    apiClient
      .get<ProductBatch[]>("/api/admin/batches/expiring-soon", { params: { days } })
      .then((r) => r.data),

  create: (data: ProductBatchRequest) =>
    apiClient.post<ProductBatch>("/api/admin/batches", data).then((r) => r.data),

  update: (id: string, data: ProductBatchRequest) =>
    apiClient.put<ProductBatch>(`/api/admin/batches/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/api/admin/batches/${id}`),
};
