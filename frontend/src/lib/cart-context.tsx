import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { cartApi, type CartItem } from "@/api/cart";
import { useAuth } from "./auth-context";
import { toast } from "sonner";

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  addItem: (productId: string, qty?: number) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<CartCtx | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addItem = async (productId: string, qty = 1) => {
    try {
      await cartApi.addItem(productId, qty);
      toast.success("Agregado al carrito");
      reload();
    } catch {
      toast.error("No se pudo agregar al carrito");
    }
  };

  const updateQty = async (itemId: string, qty: number) => {
    if (qty <= 0) return removeItem(itemId);
    try {
      await cartApi.updateQty(itemId, qty);
      reload();
    } catch {
      toast.error("Error al actualizar cantidad");
    }
  };

  const removeItem = async (itemId: string) => {
    await cartApi.removeItem(itemId);
    reload();
  };

  const clear = async () => {
    await cartApi.clearCart();
    setItems([]);
  };

  const total = items.reduce((s, i) => s + Number(i.subtotal), 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, count, total, loading, addItem, updateQty, removeItem, clear, reload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
