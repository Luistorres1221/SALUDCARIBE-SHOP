import { apiClient } from "./client";

export type OrderStatus =
  | "pendiente"
  | "aprobado"
  | "pagado"
  | "parcial"
  | "entregado"
  | "cancelado";

export interface DeliveryItem {
  itemId: string;
  productName: string;
  quantityDelivered: number;
}

export interface DeliveryRecord {
  id: string;
  deliveredAt: string;
  adminEmail: string;
  notes: string | null;
  items: DeliveryItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  deliveredQty: number;
  pendingQty: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userArea: string | null;
  costCenterId: string | null;
  costCenterName: string | null;
  dependencyId: string | null;
  dependencyName: string | null;
  status: OrderStatus;
  total: number;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
  paidAt: string | null;
  items: OrderItem[];
  deliveries: DeliveryRecord[];
}

export interface DeliverItemRequest {
  itemId: string;
  deliveredQty: number;
}

export interface DeliverOrderRequest {
  items: DeliverItemRequest[];
  notes?: string;
}

export const ordersApi = {
  getMyOrders: () =>
    apiClient.get<Order[]>("/api/orders/mine").then((r) => r.data),

  getAllOrders: () =>
    apiClient.get<Order[]>("/api/orders").then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Order>(`/api/orders/${id}`).then((r) => r.data),

  create: (costCenterId: string, dependencyId: string, notes?: string) =>
    apiClient
      .post<Order>("/api/orders", { costCenterId, dependencyId, notes })
      .then((r) => r.data),

  updateStatus: (id: string, status: OrderStatus) =>
    apiClient
      .patch<Order>(`/api/orders/${id}/status`, null, { params: { status } })
      .then((r) => r.data),

  deliver: (id: string, req: DeliverOrderRequest) =>
    apiClient.patch<Order>(`/api/orders/${id}/deliver`, req).then((r) => r.data),

  cancel: (id: string) =>
    apiClient.patch<Order>(`/api/orders/${id}/cancel`, null).then((r) => r.data),

  updateAdminNotes: (id: string, notes: string) =>
    apiClient
      .patch<Order>(`/api/orders/${id}/notes`, { notes })
      .then((r) => r.data),
};
