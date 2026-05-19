import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ordersApi, type Order } from "@/api/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/cart-context";
import { Package } from "lucide-react";

export const Route = createFileRoute("/pedidos/")({
  component: OrdersPage,
});

const STATUS_COLOR: Record<string, string> = {
  pendiente: "bg-warning text-warning-foreground",
  aprobado: "bg-primary text-primary-foreground",
  pagado: "bg-success text-success-foreground",
  entregado: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    ordersApi.getMyOrders().then(setOrders).catch(() => {});
  }, [user]);

  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Mis pedidos</h1>
      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Aún no has realizado pedidos</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} to="/pedidos/$orderId" params={{ orderId: o.id }}>
              <Card className="p-4 hover:shadow-card transition-shadow flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground">Pedido #{o.id.slice(0, 8)}</div>
                  <div className="font-medium">{new Date(o.createdAt).toLocaleString("es-CO")}</div>
                  <div className="text-sm text-muted-foreground">{o.items?.length ?? 0} productos</div>
                </div>
                <Badge className={STATUS_COLOR[o.status]}>{o.status}</Badge>
                <div className="font-bold text-lg">{formatCOP(Number(o.total))}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
