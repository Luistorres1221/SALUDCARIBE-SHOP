import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ordersApi, type Order, type OrderStatus } from "@/api/orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCOP } from "@/lib/cart-context";
import { toast } from "sonner";
import { Eye, Download, Search } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});

const STATUSES: OrderStatus[] = ["pendiente", "aprobado", "pagado", "entregado", "cancelado"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente", aprobado: "Aprobado", pagado: "Pagado",
  entregado: "Entregado", cancelado: "Cancelado",
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  pendiente: "bg-warning text-warning-foreground",
  aprobado: "bg-primary text-primary-foreground",
  pagado: "bg-success text-success-foreground",
  entregado: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);

  const load = () => {
    setLoading(true);
    ordersApi.getAllOrders()
      .then(setOrders)
      .catch(() => toast.error("No se pudieron cargar los pedidos"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

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

  const exportXLSX = () => {
    const rows = filtered.map((o) => ({
      ID: o.id.slice(0, 8),
      Usuario: o.userFullName,
      Email: o.userEmail,
      Estado: o.status,
      Total: Number(o.total),
      Fecha: new Date(o.createdAt).toLocaleString("es-CO"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, "pedidos.xlsx");
  };

  const filtered = orders.filter((o) => {
    if (filter !== "todos" && o.status !== filter) return false;
    if (search && !o.userFullName?.toLowerCase().includes(search.toLowerCase()) &&
        !o.id.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button variant="outline" size="sm" onClick={exportXLSX}>
          <Download className="w-4 h-4 mr-1" /> Exportar
        </Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <Card key={o.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{o.userFullName}</div>
                <div className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleString("es-CO")}</div>
              </div>
              <Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
              <div className="font-bold">{formatCOP(Number(o.total))}</div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setDetail(o)}><Eye className="w-4 h-4" /></Button>
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        {detail && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Pedido #{detail.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="text-sm"><span className="font-medium">Usuario:</span> {detail.userFullName}</div>
              <div className="text-sm"><span className="font-medium">Fecha:</span> {new Date(detail.createdAt).toLocaleString("es-CO")}</div>
              <div className="text-sm"><span className="font-medium">Estado:</span> {detail.status}</div>
              {detail.notes && <div className="text-sm"><span className="font-medium">Notas:</span> {detail.notes}</div>}
              <div className="border-t pt-2 space-y-1">
                {detail.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span>{it.productName} × {it.quantity}</span>
                    <span className="font-medium">{formatCOP(Number(it.subtotal))}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span><span>{formatCOP(Number(detail.total))}</span>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
