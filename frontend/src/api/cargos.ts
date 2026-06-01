import { apiClient } from "./client";

export interface Cargo {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface CargoRequest {
  name: string;
  description?: string;
  active?: boolean;
}

export const cargosApi = {
  getAll: (): Promise<Cargo[]> =>
    apiClient.get("/api/admin/cargos").then((r) => r.data),

  getActive: (): Promise<Cargo[]> =>
    apiClient.get("/api/admin/cargos/active").then((r) => r.data),

  create: (req: CargoRequest): Promise<Cargo> =>
    apiClient.post("/api/admin/cargos", req).then((r) => r.data),

  update: (id: string, req: CargoRequest): Promise<Cargo> =>
    apiClient.put(`/api/admin/cargos/${id}`, req).then((r) => r.data),

  toggleActive: (id: string): Promise<Cargo> =>
    apiClient.patch(`/api/admin/cargos/${id}/toggle`).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/admin/cargos/${id}`).then(() => undefined),
};
