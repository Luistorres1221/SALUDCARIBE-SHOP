import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  internalOrdersApi,
  type InternalOrder,
  type CreateInternalOrderRequest,
  type InternalOrderStatus,
} from "@/api/internalOrders";
import { warehousesApi, type Warehouse } from "@/api/warehouses";
import { productsApi, type Product } from "@/api/products";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedidos-internos/")({
  component: PedidosInternosPage,
});

const STATUS_CONFIG: Record<InternalOrderStatus, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800" },
  APROBADO:   { label: "Aprobado",   color: "bg-blue-100 text-blue-800" },
  ENTREGADO:  { label: "Entregado",  color: "bg-green-100 text-green-800" },
  CANCELADO:  { label: "Cancelado",  color: "bg-red-100 text-red-800" },
};

type NewItem = { productId: string; requestedQuantity: number };

function PedidosInternosPage() {
  const { user } = useAuth();
  const [orders, setOrders]         = useState<InternalOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected]     = useState<InternalOrder | null>(null);
  const [saving, setSaving]         = useState(false);

  // Form state
  const [warehouseId, setWarehouseId] = useState("");
  const [areaName, setAreaName]       = useState(user?.area ?? "");
  const [notes, setNotes]             = useState("");
  const [items, setItems]             = useState<NewItem[]>([{ productId: "", requestedQuantity: 1 }]);

  useEffect(() => {
    internalOrdersApi.getMine().then(setOrders).catch(() => {});
    warehousesApi.getActive().then(setWarehouses).catch(() => {});
    productsApi.getAll().then(setProducts).catch(() => {});
  }, []);

  const addItem = () => setItems((p) => [...p, { productId: "", requestedQuantity: 1 }]);
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const setItem = (i: number, field: keyof NewItem, val: string | number) =>
    setItems((p) => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleCreate = async () => {
    if (!warehouseId) { toast.error("Seleccione la bodega"); return; }
    if (!areaName.trim()) { toast.error("Ingrese el área"); return; }
    if (items.some((i) => !i.productId || i.requestedQuantity <= 0)) { toast.error("Complete todos los ítems"); return; }

    setSaving(true);
    try {
      const req: CreateInternalOrderRequest = { warehouseId, areaName, notes, items };
      const created = await internalOrdersApi.create(req);
      setOrders((p) => [created, ...p]);
      toast.success("Pedido interno creado. El almacenista lo revisará pronto.");
      setCreateOpen(false);
      setWarehouseId(""); setAreaName(user?.area ?? ""); setNotes("");
      setItems([{ productId: "", requestedQuantity: 1 }]);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Error al crear pedido"); }
    finally { setSaving(false); }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("es-CO") : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" /> Mis Pedidos Internos
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo pedido
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Solicita insumos o materiales directamente desde la bodega de tu área. El administrador recibirá la solicitud y la gestionará.
      </p>

      {orders.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No tienes pedidos internos aún. Crea el primero con el botón de arriba.
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const cfg = STATUS_CONFIG[o.status];
            return (
              <Card key={o.id} className="p-4 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => { setSelected(o); setDetailOpen(true); }}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-semibold">{o.areaName}</div>
                    <div className="text-xs text-muted-foreground">{o.warehouseName} · {o.items.length} ítem(s) · {fmt(o.createdAt)}</div>
                    {o.notes && <div className="text-xs text-muted-foreground mt-1 italic">{o.notes}</div>}
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0", cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {selected && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Detalle del Pedido</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={cn("px-2 py-0.5 rounded-full font-medium", STATUS_CONFIG[selected.status].color)}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
                <span className="text-muted-foreground">Bodega: <strong>{selected.warehouseName}</strong></span>
                <span className="text-muted-foreground">Área: <strong>{selected.areaName}</strong></span>
              </div>
              {selected.notes && <p className="text-sm bg-muted/40 p-2 rounded">{selected.notes}</p>}
              {selected.adminNotes && <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded text-blue-700 dark:text-blue-300">Nota del admin: {selected.adminNotes}</p>}
              {selected.receivedByName && <p className="text-sm text-green-700 dark:text-green-400">Recibido por: <strong>{selected.receivedByName}</strong></p>}
              <table className="w-full text-sm border rounded overflow-hidden">
                <thead><tr className="bg-muted/40 border-b">
                  <th className="text-left p-2">Producto</th>
                  <th className="text-center p-2">Solicitado</th>
                  <th className="text-center p-2">Aprobado</th>
                  <th className="text-center p-2">Entregado</th>
                </tr></thead>
                <tbody className="divide-y">
                  {selected.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-2"><div>{i.productName}</div><div className="text-xs text-muted-foreground">{i.productSku}</div></td>
                      <td className="p-2 text-center">{i.requestedQuantity}</td>
                      <td className="p-2 text-center">{i.approvedQuantity ?? "—"}</td>
                      <td className="p-2 text-center">{i.deliveredQuantity ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Pedido Interno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Bodega <span className="text-destructive">*</span></Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Área / Servicio <span className="text-destructive">*</span></Label>
                <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="Ej: Consulta externa" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional..." />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Productos requeridos <span className="text-destructive">*</span></Label>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Select value={item.productId} onValueChange={(v) => setItem(i, "productId", v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Producto..." /></SelectTrigger>
                      <SelectContent>{products.filter((p) => p.active).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input type="number" min={1} className="w-20 h-8 text-sm" value={item.requestedQuantity}
                    onChange={(e) => setItem(i, "requestedQuantity", Number(e.target.value))} />
                  {items.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeItem(i)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Enviando..." : "Enviar pedido"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
