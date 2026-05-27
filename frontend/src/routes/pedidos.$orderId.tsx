import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ordersApi, type Order } from "@/api/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/cart-context";
import { ArrowLeft, Building2, CheckCircle2, Clock, Layers, Truck } from "lucide-react";

export const Route = createFileRoute("/pedidos/$orderId")({
  component: OrderDetail,
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

  if (!order)
    return (
      <div className="p-8 text-center text-muted-foreground">Cargando...</div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/pedidos">
          <ArrowLeft className="w-4 h-4 mr-1" /> Mis pedidos
        </Link>
      </Button>

      {/* RF-058: notificación de pedido completado */}
      {order.status === "entregado" && (
        <Card className="p-4 mb-4 bg-green-50 border-green-200 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <div className="font-semibold text-green-800">
              ¡Tu pedido fue entregado completamente!
            </div>
            <div className="text-sm text-green-700">
              Todos los insumos solicitados han sido entregados.
            </div>
          </div>
        </Card>
      )}

      {/* RF-053: estado parcial */}
      {order.status === "parcial" && (
        <Card className="p-4 mb-4 bg-orange-50 border-orange-200 flex items-center gap-3">
          <Truck className="w-6 h-6 text-orange-500 shrink-0" />
          <div>
            <div className="font-semibold text-orange-800">
              Entrega parcial en proceso
            </div>
            <div className="text-sm text-orange-700">
              Algunos insumos han sido entregados. El resto está pendiente.
            </div>
          </div>
        </Card>
      )}

      {order.status === "pagado" && (
        <Card className="p-4 mb-4 bg-success/10 border-success/30 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <div>
            <div className="font-semibold">Pago simulado confirmado</div>
            <div className="text-sm text-muted-foreground">
              Comprobante interno generado
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-6 shadow-card">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">
              Pedido #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("es-CO")}
            </p>
            <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-none">
              {order.userFullName}{" "}
              {order.userEmail && `· ${order.userEmail}`}
              {order.userArea && ` · ${order.userArea}`}
            </p>
            {(order.costCenterName || order.dependencyName) && (
              <div className="flex flex-wrap gap-3 mt-1.5">
                {order.costCenterName && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                    <Building2 className="w-3 h-3" />
                    {order.costCenterName}
                  </span>
                )}
                {order.dependencyName && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                    <Layers className="w-3 h-3" />
                    {order.dependencyName}
                  </span>
                )}
              </div>
            )}
          </div>
          <Badge className={STATUS_COLOR[order.status]}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Badge>
        </div>

        {/* RF-047 a RF-050: tabla con cantidades entregadas y pendientes */}
        <div className="border-t pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Producto</th>
                  <th className="text-center pb-2">Cant.</th>
                  <th className="text-center pb-2 text-green-600">
                    Entregado
                  </th>
                  <th className="text-center pb-2 text-orange-500">
                    Pendiente
                  </th>
                  <th className="text-right pb-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items?.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 font-medium">{it.productName}</td>
                    <td className="py-2 text-center">{it.quantity}</td>
                    <td className="py-2 text-center font-medium text-green-600">
                      {it.deliveredQty ?? 0}
                    </td>
                    <td className="py-2 text-center text-orange-500">
                      {it.pendingQty ?? it.quantity}
                    </td>

                    <td className="py-2 text-right font-medium">
                      {formatCOP(Number(it.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCOP(Number(order.total))}</span>
        </div>

        {order.notes && (
          <div className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium">Notas: </span>
            {order.notes}
          </div>
        )}

        {/* RF-060: observaciones del administrador visibles al usuario */}
        {order.adminNotes && (
          <div className="mt-3 text-sm bg-muted/40 rounded-lg p-3">
            <span className="font-medium">Observaciones del administrador: </span>
            {order.adminNotes}
          </div>
        )}
      </Card>

      {/* RF-056: historial de entregas visible al usuario */}
      {order.deliveries && order.deliveries.length > 0 && (
        <Card className="p-4 mt-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Historial de entregas
          </h2>
          <div className="space-y-2">
            {order.deliveries.map((d) => (
              <div key={d.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(d.deliveredAt).toLocaleString("es-CO")}
                </div>
                {d.notes && (
                  <p className="italic text-muted-foreground mb-1">
                    "{d.notes}"
                  </p>
                )}
                <ul className="space-y-0.5">
                  {d.items.map((di, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{di.productName}</span>
                      <span className="font-medium text-green-600">
                        +{di.quantityDelivered} entregadas
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
