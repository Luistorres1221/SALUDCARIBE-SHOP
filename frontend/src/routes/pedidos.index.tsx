import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ordersApi, type Order } from "@/api/orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  parcial: "bg-orange-500 text-white",
  entregado: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  pagado: "Pagado",
  parcial: "Parcialmente entregado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(false);

    ordersApi.getMyOrders()
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch(() => {
        if (!cancelled) setOrdersError(true);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Mis pedidos</h1>
      {ordersLoading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </Card>
      ) : ordersError ? (
        <Card className="p-12 text-center space-y-4">
          <p className="text-muted-foreground">No se pudieron cargar tus pedidos.</p>
          <Button onClick={() => setReloadKey((key) => key + 1)}>Reintentar</Button>
        </Card>
      ) : orders.length === 0 ? (
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
                <Badge className={STATUS_COLOR[o.status]}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </Badge>
                <div className="font-bold text-lg">{formatCOP(Number(o.total))}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
