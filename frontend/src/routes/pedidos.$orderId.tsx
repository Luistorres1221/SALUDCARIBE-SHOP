import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ordersApi, type Order } from "@/api/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/cart-context";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pedidos/$orderId")({
  component: OrderDetail,
});

const STATUS_COLOR: Record<string, string> = {
  pendiente: "bg-warning text-warning-foreground",
  aprobado: "bg-primary text-primary-foreground",
  pagado: "bg-success text-success-foreground",
  entregado: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    ordersApi.getById(orderId).then(setOrder).catch(() => {});
  }, [orderId]);

  if (!order) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/pedidos"><ArrowLeft className="w-4 h-4 mr-1" /> Mis pedidos</Link>
      </Button>

      {order.status === "pagado" && (
        <Card className="p-4 mb-4 bg-success/10 border-success/30 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <div>
            <div className="font-semibold">Pago simulado confirmado</div>
            <div className="text-sm text-muted-foreground">Comprobante interno generado</div>
          </div>
        </Card>
      )}

      <Card className="p-6 shadow-card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("es-CO")}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.userFullName} {order.userEmail && `· ${order.userEmail}`}
            </p>
          </div>
          <Badge className={STATUS_COLOR[order.status]}>{order.status}</Badge>
        </div>

        <div className="border-t pt-4 space-y-2">
          {order.items?.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <div>
                <div className="font-medium">{it.productName}</div>
                <div className="text-muted-foreground">{it.quantity} × {formatCOP(Number(it.unitPrice))}</div>
              </div>
              <div className="font-medium">{formatCOP(Number(it.subtotal))}</div>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCOP(Number(order.total))}</span>
        </div>

        {order.notes && (
          <div className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium">Notas:</span> {order.notes}
          </div>
        )}
      </Card>
    </div>
  );
}
