import { apiClient } from "./client";

export interface Dependency {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface DependencyRequest {
  code: string;
  name: string;
  active: boolean;
}

export const dependenciesApi = {
  listActive: () =>
    apiClient.get<Dependency[]>("/api/dependencies").then((r) => r.data),

  listAll: () =>
    apiClient.get<Dependency[]>("/api/admin/dependencies").then((r) => r.data),

  create: (data: DependencyRequest) =>
    apiClient.post<Dependency>("/api/admin/dependencies", data).then((r) => r.data),

  update: (id: string, data: DependencyRequest) =>
    apiClient.put<Dependency>(`/api/admin/dependencies/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/api/admin/dependencies/${id}`),
};
