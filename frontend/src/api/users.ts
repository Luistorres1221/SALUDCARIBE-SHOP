import { apiClient } from "./client";
import type { AppRole } from "@/lib/auth-context";

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  area: string | null;
  roles: AppRole[];
  createdAt: string;
}

export interface UserRequest {
  email: string;
  password?: string;
  fullName: string;
  area?: string;
}

export const usersApi = {
  getAll: () =>
    apiClient.get<ApiUser[]>("/api/users").then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiUser>(`/api/users/${id}`).then((r) => r.data),

  create: (data: UserRequest) =>
    apiClient.post<ApiUser>("/api/users", data).then((r) => r.data),

  update: (id: string, data: UserRequest) =>
    apiClient.put<ApiUser>(`/api/users/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/api/users/${id}`),

  assignRole: (id: string, role: AppRole) =>
    apiClient.post(`/api/users/${id}/roles/${role}`),

  removeRole: (id: string, role: AppRole) =>
    apiClient.delete(`/api/users/${id}/roles/${role}`),
};
