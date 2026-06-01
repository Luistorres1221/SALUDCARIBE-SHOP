import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  internalOrdersApi,
  type InternalOrder,
  type InternalOrderStatus,
  type ApproveInternalOrderRequest,
  type DeliverInternalOrderRequest,
} from "@/api/internalOrders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, ClipboardList, PackageCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/cart-context";

export const Route = createFileRoute("/admin/pedidos-internos")({
  component: AdminPedidosInternos,
});

const STATUS_CONFIG: Record<InternalOrderStatus, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  APROBADO:   { label: "Aprobado",   color: "bg-blue-100 text-blue-800 border-blue-300" },
  ENTREGADO:  { label: "Entregado",  color: "bg-green-100 text-green-800 border-green-300" },
  CANCELADO:  { label: "Cancelado",  color: "bg-red-100 text-red-800 border-red-300" },
};

function AdminPedidosInternos() {
  const [orders, setOrders]         = useState<InternalOrder[]>([]);
  const [statusFilter, setStatus]   = useState<InternalOrderStatus | "TODOS">("TODOS");
  const [selected, setSelected]     = useState<InternalOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");
  const [deliverNotes, setDeliverNotes] = useState("");
  const [saving, setSaving]         = useState(false);

  const load = () => internalOrdersApi.getAll().then(setOrders).catch(() => {});
  useEffect(() => { load(); }, []);

  const visible = statusFilter === "TODOS" ? orders : orders.filter((o) => o.status === statusFilter);

  const openDetail = (o: InternalOrder) => { setSelected(o); setDetailOpen(true); };

  const handleApprove = async () => {
    if (!selected) return;
    const req: ApproveInternalOrderRequest = { adminNotes: "" };
    setSaving(true);
    try {
      const updated = await internalOrdersApi.approve(selected.id, req);
      setOrders((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      toast.success("Pedido aprobado");
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Error"); }
    finally { setSaving(false); }
  };

  const handleDeliver = async () => {
    if (!selected) return;
    if (!receivedBy.trim()) { toast.error("Ingrese quién recibe los productos"); return; }
    const req: DeliverInternalOrderRequest = { receivedByName: receivedBy, notes: deliverNotes };
    setSaving(true);
    try {
      const updated = await internalOrdersApi.deliver(selected.id, req);
      setOrders((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      setDeliverOpen(false);
      toast.success("Entrega registrada — stock descontado de la bodega");
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Stock insuficiente o error al entregar"); }
    finally { setSaving(false); }
  };

  const handleCancel = async () => {
    if (!selected) return;
    if (!confirm("¿Cancelar este pedido?")) return;
    setSaving(true);
    try {
      const updated = await internalOrdersApi.cancel(selected.id);
      setOrders((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      toast.success("Pedido cancelado");
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Error"); }
    finally { setSaving(false); }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("es-CO") : "—";

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" /> Pedidos Internos
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["PENDIENTE", "APROBADO", "ENTREGADO", "CANCELADO"] as InternalOrderStatus[]).map((s) => (
          <Card key={s} className={cn("p-3 text-center cursor-pointer hover:shadow-sm transition-shadow", statusFilter === s && "ring-2 ring-primary")}
            onClick={() => setStatus(statusFilter === s ? "TODOS" : s)}>
            <div className="text-xl font-bold">{orders.filter((o) => o.status === s).length}</div>
            <div className="text-xs text-muted-foreground">{STATUS_CONFIG[s].label}</div>
          </Card>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["TODOS", "PENDIENTE", "APROBADO", "ENTREGADO", "CANCELADO"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
            {s === "TODOS" ? `Todos (${orders.length})` : `${STATUS_CONFIG[s].label} (${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Sin pedidos internos para mostrar.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 font-semibold">Área / Bodega</th>
                  <th className="text-left p-3 font-semibold">Solicitado por</th>
                  <th className="text-center p-3 font-semibold">Fecha</th>
                  <th className="text-center p-3 font-semibold">Ítems</th>
                  <th className="text-center p-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((o) => {
                  const cfg = STATUS_CONFIG[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openDetail(o)}>
                      <td className="p-3">
                        <div className="font-medium">{o.areaName}</div>
                        <div className="text-xs text-muted-foreground">{o.warehouseName}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{o.requestedByName ?? "—"}</td>
                      <td className="p-3 text-center text-xs">{fmt(o.createdAt)}</td>
                      <td className="p-3 text-center">{o.items.length}</td>
                      <td className="p-3 text-center">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", cfg.color)}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Dialog */}
      {selected && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pedido Interno — {selected.areaName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className={cn("px-2 py-0.5 rounded-full border font-medium", STATUS_CONFIG[selected.status].color)}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
                <span>Bodega: <strong>{selected.warehouseName}</strong></span>
                <span>Solicitado por: <strong>{selected.requestedByName}</strong></span>
                <span>Fecha: {fmt(selected.createdAt)}</span>
              </div>
              {selected.notes && <p className="text-sm bg-muted/40 p-2 rounded">{selected.notes}</p>}
              {selected.adminNotes && <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded text-blue-700 dark:text-blue-300">Nota admin: {selected.adminNotes}</p>}
              {selected.receivedByName && <p className="text-sm text-green-700 dark:text-green-400">Recibido por: <strong>{selected.receivedByName}</strong></p>}

              <table className="w-full text-sm border rounded overflow-hidden">
                <thead><tr className="bg-muted/40 border-b">
                  <th className="text-left p-2">Producto</th>
                  <th className="text-center p-2">Solicitado</th>
                  <th className="text-center p-2">Aprobado</th>
                  <th className="text-center p-2">Entregado</th>
                  <th className="text-right p-2">Valor unit.</th>
                </tr></thead>
                <tbody className="divide-y">
                  {selected.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-2"><div>{i.productName}</div><div className="text-xs text-muted-foreground">{i.productSku}</div></td>
                      <td className="p-2 text-center">{i.requestedQuantity}</td>
                      <td className="p-2 text-center">{i.approvedQuantity ?? "—"}</td>
                      <td className="p-2 text-center">{i.deliveredQuantity ?? "—"}</td>
                      <td className="p-2 text-right text-xs">{i.unitPrice ? formatCOP(Number(i.unitPrice)) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter className="flex gap-2 flex-wrap">
              {selected.status === "PENDIENTE" && (
                <>
                  <Button variant="outline" className="text-destructive border-destructive" onClick={handleCancel} disabled={saving}>
                    <XCircle className="w-4 h-4 mr-1" /> Cancelar pedido
                  </Button>
                  <Button onClick={handleApprove} disabled={saving}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                  </Button>
                </>
              )}
              {selected.status === "APROBADO" && (
                <Button onClick={() => { setReceivedBy(""); setDeliverNotes(""); setDeliverOpen(true); }} disabled={saving}>
                  <PackageCheck className="w-4 h-4 mr-1" /> Registrar entrega
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Deliver Dialog */}
      <Dialog open={deliverOpen} onOpenChange={setDeliverOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle><PackageCheck className="inline w-4 h-4 mr-1" /> Confirmar entrega</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Al confirmar, se descontará el stock aprobado de la bodega <strong>{selected?.warehouseName}</strong>.
            </p>
            <div className="space-y-1">
              <Label>Nombre de quien recibe <span className="text-destructive">*</span></Label>
              <Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Nombre completo..." />
            </div>
            <div className="space-y-1">
              <Label>Observaciones adicionales</Label>
              <Input value={deliverNotes} onChange={(e) => setDeliverNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverOpen(false)}>Cancelar</Button>
            <Button onClick={handleDeliver} disabled={saving}>{saving ? "Registrando..." : "Confirmar entrega"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
