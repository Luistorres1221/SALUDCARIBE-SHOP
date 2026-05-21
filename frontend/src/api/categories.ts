import { apiClient } from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
}

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
}

export const categoriesApi = {
  getAll: () =>
    apiClient.get<Category[]>("/api/categories").then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Category>(`/api/categories/${id}`).then((r) => r.data),

  create: (data: CategoryRequest) =>
    apiClient.post<Category>("/api/categories", data).then((r) => r.data),

  update: (id: string, data: CategoryRequest) =>
    apiClient.put<Category>(`/api/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/api/categories/${id}`),
};
