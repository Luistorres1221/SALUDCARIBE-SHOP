import { apiClient } from "./client";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productPrice: number;
  productImageUrl: string | null;
  productStock: number;
  quantity: number;
  subtotal: number;
}

export const cartApi = {
  getCart: () =>
    apiClient.get<CartItem[]>("/api/cart").then((r) => r.data),

  addItem: (productId: string, quantity = 1) =>
    apiClient.post<CartItem>("/api/cart/items", { productId, quantity }).then((r) => r.data),

  updateQty: (itemId: string, quantity: number) =>
    apiClient.put<CartItem | null>(`/api/cart/items/${itemId}`, null, { params: { quantity } }).then((r) => r.data),

  removeItem: (itemId: string) =>
    apiClient.delete(`/api/cart/items/${itemId}`),

  clearCart: () =>
    apiClient.delete("/api/cart"),
};
