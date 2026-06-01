import { apiClient } from "./client";

export type WarehouseType = "PRINCIPAL" | "SUBBODEGA";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  description: string;
  type: WarehouseType;
  active: boolean;
  createdAt: string;
}

export interface WarehouseRequest {
  code: string;
  name: string;
  location: string;
  description?: string;
  type: WarehouseType;
  active?: boolean;
}

export const warehousesApi = {
  getActive: (): Promise<Warehouse[]> =>
    apiClient.get("/api/warehouses").then((r) => r.data),

  getAll: (): Promise<Warehouse[]> =>
    apiClient.get("/api/admin/warehouses").then((r) => r.data),

  getById: (id: string): Promise<Warehouse> =>
    apiClient.get(`/api/admin/warehouses/${id}`).then((r) => r.data),

  create: (req: WarehouseRequest): Promise<Warehouse> =>
    apiClient.post("/api/admin/warehouses", req).then((r) => r.data),

  update: (id: string, req: WarehouseRequest): Promise<Warehouse> =>
    apiClient.put(`/api/admin/warehouses/${id}`, req).then((r) => r.data),
};
