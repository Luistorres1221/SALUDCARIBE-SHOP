import { apiClient } from "./client";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  active: boolean;
  createdAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId?: string;
}

export interface ProductPatch {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  categoryId?: string;
  active?: boolean;
}

export const productsApi = {
  getAll: (params?: { q?: string; categoryId?: string }) =>
    apiClient.get<Product[]>("/api/products", { params }).then((r) => r.data),

  getAllAdmin: () =>
    apiClient.get<Product[]>("/api/products/admin").then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Product>(`/api/products/${id}`).then((r) => r.data),

  create: (data: ProductRequest) =>
    apiClient.post<Product>("/api/products", data).then((r) => r.data),

  update: (id: string, data: ProductRequest) =>
    apiClient.put<Product>(`/api/products/${id}`, data).then((r) => r.data),

  patch: (id: string, data: ProductPatch) =>
    apiClient.patch<Product>(`/api/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/api/products/${id}`),
};
