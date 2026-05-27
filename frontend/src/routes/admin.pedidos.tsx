import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ordersApi,
  type Order,
  type OrderStatus,
  type DeliverItemRequest,
} from "@/api/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCOP } from "@/lib/cart-context";
import { toast } from "sonner";
import {
  Eye,
  Download,
  Search,
  Truck,
  XCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});

const STATUSES: OrderStatus[] = [
  "pendiente",
  "aprobado",
  "pagado",
  "parcial",
  "entregado",
  "cancelado",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  pagado: "Pagado",
  parcial: "Parcial",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pendiente: "bg-warning text-warning-foreground",
  aprobado: "bg-primary text-primary-foreground",
  pagado: "bg-success text-success-foreground",
  parcial: "bg-orange-500 text-white",
  entregado: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

const CANCELLABLE: OrderStatus[] = ["pendiente", "aprobado", "pagado", "parcial"];
const DELIVERABLE: OrderStatus[] = ["pendiente", "aprobado", "pagado", "parcial"];

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);

  // Delivery state
  const [deliverAmounts, setDeliverAmounts] = useState<Record<string, number>>({});
  const [deliverNotes, setDeliverNotes] = useState("");
  const [delivering, setDelivering] = useState(false);

  // Admin notes state
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Cancel state
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    ordersApi
      .getAllOrders()
      .then(setOrders)
      .catch(() => toast.error("No se pudieron cargar los pedidos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = (o: Order) => {
    setDetail(o);
    const amounts: Record<string, number> = {};
    o.items.forEach((item) => {
      amounts[item.id] = 0;
    });
    setDeliverAmounts(amounts);
    setDeliverNotes("");
    setAdminNotesInput(o.adminNotes ?? "");
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      const updated = await ordersApi.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (detail?.id === id) setDetail(updated);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  // RF-048 a RF-057: confirmar entrega (parcial o total)
  const handleDeliver = async () => {
    if (!detail) return;
    const items: DeliverItemRequest[] = Object.entries(deliverAmounts)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, deliveredQty]) => ({ itemId, deliveredQty }));

    if (items.length === 0) {
      toast.error("Ingresa al menos una cantidad a entregar");
      return;
    }

    setDelivering(true);
    try {
      const updated = await ordersApi.deliver(detail.id, {
        items,
        notes: deliverNotes || undefined,
      });
      setOrders((prev) => prev.map((o) => (o.id === detail.id ? updated : o)));
      setDetail(updated);

      const newAmounts: Record<string, number> = {};
      updated.items.forEach((item) => {
        newAmounts[item.id] = 0;
      });
      setDeliverAmounts(newAmounts);
      setDeliverNotes("");

      // RF-058: notificación cuando el pedido se completa
      if (updated.status === "entregado") {
        toast.success(
          "✓ Pedido completado. Todos los insumos han sido entregados."
        );
      } else {
        toast.success("Entrega parcial registrada correctamente");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al registrar entrega");
    } finally {
      setDelivering(false);
    }
  };

  // RF-059: cancelar pedido
  const handleCancel = async () => {
    if (!detail) return;
    if (
      !confirm(
        `¿Cancelar el pedido #${detail.id.slice(0, 8)}?\nSe restaurará el stock de los insumos no entregados.`
      )
    )
      return;

    setCancelling(true);
    try {
      const updated = await ordersApi.cancel(detail.id);
      setOrders((prev) => prev.map((o) => (o.id === detail.id ? updated : o)));
      setDetail(updated);
      toast.success("Pedido cancelado");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al cancelar pedido");
    } finally {
      setCancelling(false);
    }
  };

  // RF-060: guardar observaciones del administrador
  const handleSaveNotes = async () => {
    if (!detail) return;
    setSavingNotes(true);
    try {
      const updated = await ordersApi.updateAdminNotes(
        detail.id,
        adminNotesInput
      );
      setOrders((prev) => prev.map((o) => (o.id === detail.id ? updated : o)));
      setDetail(updated);
      toast.success("Observaciones guardadas");
    } catch {
      toast.error("Error al guardar observaciones");
    } finally {
      setSavingNotes(false);
    }
  };

  const exportXLSX = () => {
    const rows = filtered.map((o) => ({
      ID: o.id.slice(0, 8),
      Usuario: o.userFullName,
      Email: o.userEmail,
      Área: o.userArea ?? "",
      Estado: STATUS_LABEL[o.status],
      Total: Number(o.total),
      Fecha: new Date(o.createdAt).toLocaleString("es-CO"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, "pedidos.xlsx");
  };

  // RF-046: filtros por estado, fecha, área/usuario
  const filtered = orders.filter((o) => {
    if (filterStatus !== "todos" && o.status !== filterStatus) return false;
    if (dateFrom && new Date(o.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(o.createdAt) > new Date(dateTo + "T23:59:59"))
      return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesName = o.userFullName?.toLowerCase().includes(q);
      const matchesEmail = o.userEmail?.toLowerCase().includes(q);
      const matchesArea = o.userArea?.toLowerCase().includes(q);
      const matchesId = o.id.includes(q);
      if (!matchesName && !matchesEmail && !matchesArea && !matchesId)
        return false;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button variant="outline" size="sm" onClick={exportXLSX}>
          <Download className="w-4 h-4 mr-1" /> Exportar
        </Button>
      </div>

      {/* RF-046: Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario, email, área..."
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="Desde"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="Hasta"
        />
      </div>

      {/* RF-045: Lista de pedidos */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              No se encontraron pedidos.
            </Card>
          )}
          {filtered.map((o) => (
            <Card key={o.id} className="p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{o.userFullName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    #{o.id.slice(0, 8)} ·{" "}
                    {new Date(o.createdAt).toLocaleString("es-CO")}
                    {o.userArea && ` · ${o.userArea}`}
                    {o.costCenterName && ` · CC: ${o.costCenterName}`}
                    {o.dependencyName && ` · ${o.dependencyName}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={STATUS_COLOR[o.status]}>
                    {STATUS_LABEL[o.status]}
                  </Badge>
                  <div className="font-bold text-sm sm:text-base">{formatCOP(Number(o.total))}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 items-center mt-2 pt-2 border-t border-border/50">
                <Button size="sm" variant="ghost" onClick={() => openDetail(o)} className="h-8 gap-1.5">
                  <Eye className="w-4 h-4" /> Ver detalle
                </Button>
                <Select
                  value={o.status}
                  onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}
                >
                  <SelectTrigger className="w-36 h-8 text-xs ml-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* RF-047 a RF-060: Diálogo de detalle */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        {detail && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 flex-wrap">
                Pedido #{detail.id.slice(0, 8)}
                <Badge className={STATUS_COLOR[detail.status]}>
                  {STATUS_LABEL[detail.status]}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* Información del usuario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
                <div>
                  <span className="text-muted-foreground">Usuario: </span>
                  <span className="font-medium">{detail.userFullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {detail.userEmail}
                </div>
                {detail.userArea && (
                  <div>
                    <span className="text-muted-foreground">Área: </span>
                    {detail.userArea}
                  </div>
                )}
                {detail.costCenterName && (
                  <div>
                    <span className="text-muted-foreground">Centro de costo: </span>
                    <span className="font-medium">{detail.costCenterName}</span>
                  </div>
                )}
                {detail.dependencyName && (
                  <div>
                    <span className="text-muted-foreground">Dependencia: </span>
                    <span className="font-medium">{detail.dependencyName}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Fecha: </span>
                  {new Date(detail.createdAt).toLocaleString("es-CO")}
                </div>
                {detail.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">
                      Notas del usuario:{" "}
                    </span>
                    {detail.notes}
                  </div>
                )}
              </div>

              {/* RF-048 a RF-051: Tabla de productos con gestión de entrega */}
              {DELIVERABLE.includes(detail.status) ? (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Gestión de entrega
                  </h3>
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Producto</th>
                          <th className="text-center p-2">Solicitado</th>
                          <th className="text-center p-2 text-success">
                            Entregado
                          </th>
                          <th className="text-center p-2 text-warning">
                            Pendiente
                          </th>
                          <th className="text-center p-2">A entregar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2 font-medium">
                              {item.productName}
                            </td>
                            {/* RF-049: cantidad solicitada */}
                            <td className="p-2 text-center">{item.quantity}</td>
                            {/* RF-049: cantidad entregada */}
                            <td className="p-2 text-center font-medium text-green-600">
                              {item.deliveredQty ?? 0}
                            </td>
                            {/* RF-050: cantidad pendiente */}
                            <td className="p-2 text-center font-medium text-orange-500">
                              {item.pendingQty ?? item.quantity}
                            </td>
                            {/* RF-048: input para esta entrega */}
                            <td className="p-2 text-center">
                              <Input
                                type="number"
                                min={0}
                                max={item.pendingQty ?? item.quantity}
                                value={deliverAmounts[item.id] ?? 0}
                                onChange={(e) => {
                                  const maxAllowed = item.pendingQty ?? item.quantity;
                                  setDeliverAmounts((prev) => ({
                                    ...prev,
                                    [item.id]: Math.min(
                                      Math.max(0, Number(e.target.value)),
                                      maxAllowed
                                    ),
                                  }));
                                }}
                                className="w-20 text-center mx-auto"
                                disabled={(item.pendingQty ?? item.quantity) === 0}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 space-y-2">
                    <Textarea
                      placeholder="Observaciones de esta entrega (opcional)..."
                      value={deliverNotes}
                      onChange={(e) => setDeliverNotes(e.target.value)}
                      rows={2}
                    />
                    <Button
                      onClick={handleDeliver}
                      disabled={delivering}
                      className="w-full"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {delivering ? "Registrando..." : "Confirmar entrega"}
                    </Button>
                  </div>
                </div>
              ) : (
                /* RF-047: Detalle de productos (pedidos no activos) */
                <div>
                  <h3 className="font-semibold mb-2">Productos del pedido</h3>
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Producto</th>
                          <th className="text-center p-2">Solicitado</th>
                          <th className="text-center p-2">Entregado</th>
                          <th className="text-center p-2">Pendiente</th>
                          <th className="text-right p-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2 font-medium">
                              {item.productName}
                            </td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-center font-medium text-green-600">
                              {item.deliveredQty ?? 0}
                            </td>
                            <td className="p-2 text-center text-muted-foreground">
                              {item.pendingQty ?? item.quantity}
                            </td>
                            <td className="p-2 text-right">
                              {formatCOP(Number(item.subtotal))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total del pedido</span>
                <span>{formatCOP(Number(detail.total))}</span>
              </div>

              {/* RF-058: alerta de pedido completado */}
              {detail.status === "entregado" && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-green-800 font-medium">
                    Pedido completado — todos los insumos fueron entregados.
                  </span>
                </div>
              )}

              {/* RF-060: observaciones del administrador */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Observaciones del
                  administrador
                </h3>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Agregar comentarios u observaciones..."
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                  >
                    {savingNotes ? "Guardando..." : "Guardar observaciones"}
                  </Button>
                </div>
              </div>

              {/* RF-056: historial de entregas */}
              {detail.deliveries && detail.deliveries.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Historial de entregas
                  </h3>
                  <div className="space-y-2">
                    {detail.deliveries.map((d) => (
                      <div
                        key={d.id}
                        className="bg-muted/30 rounded-lg p-3 text-sm"
                      >
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{d.adminEmail}</span>
                          <span>
                            {new Date(d.deliveredAt).toLocaleString("es-CO")}
                          </span>
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
                </div>
              )}

              {/* Cambio de estado + RF-059: cancelar */}
              <div className="flex gap-2 flex-wrap border-t pt-3">
                <Select
                  value={detail.status}
                  onValueChange={(v) =>
                    updateStatus(detail.id, v as OrderStatus)
                  }
                >
                  <SelectTrigger className="flex-1 min-w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {CANCELLABLE.includes(detail.status) && (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {cancelling ? "Cancelando..." : "Cancelar pedido"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
