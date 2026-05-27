import { apiClient } from "./client";

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  budget: number | null;
  active: boolean;
}

export interface CostCenterRequest {
  code: string;
  name: string;
  budget: number | null;
  active: boolean;
}

export const costCentersApi = {
  listActive: () =>
    apiClient.get<CostCenter[]>("/api/cost-centers").then((r) => r.data),

  listAll: () =>
    apiClient.get<CostCenter[]>("/api/admin/cost-centers").then((r) => r.data),

  create: (data: CostCenterRequest) =>
    apiClient.post<CostCenter>("/api/admin/cost-centers", data).then((r) => r.data),

  update: (id: string, data: CostCenterRequest) =>
    apiClient.put<CostCenter>(`/api/admin/cost-centers/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/api/admin/cost-centers/${id}`),
};
