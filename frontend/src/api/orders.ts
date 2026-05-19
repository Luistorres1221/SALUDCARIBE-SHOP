import { apiClient } from "./client";

export type OrderStatus = "pendiente" | "aprobado" | "pagado" | "entregado" | "cancelado";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
}

export const ordersApi = {
  getMyOrders: () =>
    apiClient.get<Order[]>("/api/orders/mine").then((r) => r.data),

  getAllOrders: () =>
    apiClient.get<Order[]>("/api/orders").then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Order>(`/api/orders/${id}`).then((r) => r.data),

  create: (notes?: string) =>
    apiClient.post<Order>("/api/orders", { notes }).then((r) => r.data),

  updateStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<Order>(`/api/orders/${id}/status`, null, { params: { status } }).then((r) => r.data),
};
