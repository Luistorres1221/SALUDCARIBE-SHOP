import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { batchesApi, type ProductBatch, type ProductBatchRequest } from "@/api/batches";
import { productsApi, type Product } from "@/api/products";
import { formatCOP } from "@/lib/cart-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Edit,
  FlaskConical,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/lotes")({
  component: AdminLotes,
});

// ── Types ─────────────────────────────────────────────────────────────────────
type StatusFilter = "todos" | "vencido" | "por_vencer" | "vigente";

const STATUS_CONFIG = {
  vigente:    { label: "Vigente",      color: "bg-success text-success-foreground",  icon: CheckCircle2  },
  por_vencer: { label: "Por vencer",   color: "bg-orange-500 text-white",            icon: CalendarClock },
  vencido:    { label: "Vencido",      color: "bg-destructive text-destructive-foreground", icon: XCircle },
} as const;

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: ProductBatchRequest = {
  productId: "",
  batchNumber: "",
  initialQuantity: 1,
  remainingQuantity: 1,
  costPerUnit: 0,
  expirationDate: "",
  receivedDate: today(),
  active: true,
};

// ── Component ─────────────────────────────────────────────────────────────────
function AdminLotes() {
  const [batches, setBatches]       = useState<ProductBatch[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<StatusFilter>("todos");
  const [catFilter, setCat]         = useState("todos");
  const [open, setOpen]             = useState(false);
  const [editing, setEditing]       = useState<ProductBatch | null>(null);
  const [form, setForm]             = useState<ProductBatchRequest>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const load = () => batchesApi.listAll().then(setBatches).catch(() => {});

  useEffect(() => {
    load();
    productsApi.getAllAdmin().then(setProducts).catch(() => {});
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────
  const vencidos    = batches.filter((b) => b.status === "vencido"    && b.remainingQuantity > 0);
  const porVencer   = batches.filter((b) => b.status === "por_vencer" && b.remainingQuantity > 0);
  const valorRiesgo = [...vencidos, ...porVencer].reduce((s, b) => s + Number(b.totalValue), 0);

  // ── Categories for filter ────────────────────────────────────────────────
  const categories = [...new Set(batches.map((b) => b.categoryName ?? "Sin categoría").filter(Boolean))];

  // ── Filtered list ────────────────────────────────────────────────────────
  const visible = batches.filter((b) => {
    if (statusFilter !== "todos" && b.status !== statusFilter) return false;
    if (catFilter !== "todos" && (b.categoryName ?? "Sin categoría") !== catFilter) return false;
    const q = search.toLowerCase();
    if (q && !b.productName.toLowerCase().includes(q) &&
             !b.productSku.toLowerCase().includes(q) &&
             !b.batchNumber.toLowerCase().includes(q)) return false;
    return true;
  });

  // ── Dialog helpers ───────────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  };

  const openEdit = (b: ProductBatch) => {
    setEditing(b);
    setForm({
      productId:         b.productId,
      batchNumber:       b.batchNumber,
      initialQuantity:   b.initialQuantity,
      remainingQuantity: b.remainingQuantity,
      costPerUnit:       Number(b.costPerUnit),
      expirationDate:    b.expirationDate,
      receivedDate:      b.receivedDate,
      active:            b.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.productId)       { toast.error("Seleccione un producto");         return; }
    if (!form.batchNumber)     { toast.error("Ingrese el número de lote");      return; }
    if (!form.expirationDate)  { toast.error("Ingrese la fecha de vencimiento");return; }
    if (form.costPerUnit <= 0) { toast.error("El costo debe ser mayor que 0");  return; }

    setSaving(true);
    try {
      const saved = editing
        ? await batchesApi.update(editing.id, form)
        : await batchesApi.create(form);
      setBatches((prev) =>
        editing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved],
      );
      toast.success(editing ? "Lote actualizado" : "Lote registrado");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Desactivar este lote?")) return;
    try {
      await batchesApi.remove(id);
      toast.success("Lote desactivado");
      load();
    } catch {
      toast.error("No se pudo desactivar");
    }
  };

  // ── Days until expiration helper ─────────────────────────────────────────
  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - new Date(today()).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="w-6 h-6" /> Lotes y Vencimientos
        </h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Registrar lote
        </Button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FlaskConical} label="Total lotes activos" value={batches.filter(b => b.active).length} color="text-primary" />
        <StatCard icon={XCircle}      label="Lotes vencidos"      value={vencidos.length}   color="text-destructive" alert={vencidos.length > 0} />
        <StatCard icon={CalendarClock}label="Por vencer (30 días)"value={porVencer.length}  color="text-orange-500"  alert={porVencer.length > 0} />
        <StatCard icon={AlertTriangle} label="Valor en riesgo"    value={formatCOP(valorRiesgo)} color="text-amber-600" alert={valorRiesgo > 0} />
      </div>

      {/* ── Alertas ──────────────────────────────────────────────────────── */}
      {vencidos.length > 0 && (
        <Card className="p-3 bg-destructive/10 border-destructive/30">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm mb-1">
            <XCircle className="w-4 h-4" /> {vencidos.length} lote(s) VENCIDO(S) con stock disponible
          </div>
          <div className="text-xs text-muted-foreground">
            {vencidos.map((b) => `${b.productName} — Lote ${b.batchNumber} (${b.remainingQuantity} uds)`).join(" · ")}
          </div>
        </Card>
      )}
      {porVencer.length > 0 && (
        <Card className="p-3 bg-orange-50 border-orange-200 dark:bg-orange-950/20">
          <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm mb-1">
            <CalendarClock className="w-4 h-4" /> {porVencer.length} lote(s) por vencer en los próximos 30 días
          </div>
          <div className="text-xs text-muted-foreground">
            {porVencer.map((b) => `${b.productName} — Lote ${b.batchNumber} (vence ${b.expirationDate})`).join(" · ")}
          </div>
        </Card>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por producto, SKU o lote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm w-60"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="h-8 text-sm w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="vigente">Vigentes</SelectItem>
            <SelectItem value="por_vencer">Por vencer</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCat}>
          <SelectTrigger className="h-8 text-sm w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter !== "todos" || catFilter !== "todos") && (
          <Button size="sm" variant="ghost" className="h-8 text-xs"
            onClick={() => { setSearch(""); setStatus("todos"); setCat("todos"); }}>
            Limpiar
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {visible.length} lote{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {batches.length === 0 ? "No hay lotes registrados." : "Sin resultados para los filtros aplicados."}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 font-semibold">Producto</th>
                  <th className="text-left p-3 font-semibold">Lote</th>
                  <th className="text-left p-3 font-semibold">Categoría</th>
                  <th className="text-center p-3 font-semibold">F. Recepción</th>
                  <th className="text-center p-3 font-semibold">F. Vencimiento</th>
                  <th className="text-center p-3 font-semibold">Cant. Inicial</th>
                  <th className="text-center p-3 font-semibold">Restante</th>
                  <th className="text-right p-3 font-semibold">Costo/u</th>
                  <th className="text-right p-3 font-semibold">Valor total</th>
                  <th className="text-center p-3 font-semibold">Estado</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((b) => {
                  const cfg  = STATUS_CONFIG[b.status];
                  const days = daysUntil(b.expirationDate);
                  const rowCls = b.status === "vencido"
                    ? "bg-destructive/5"
                    : b.status === "por_vencer"
                    ? "bg-orange-50/60 dark:bg-orange-950/10"
                    : "";

                  return (
                    <tr key={b.id} className={cn("hover:bg-muted/30 transition-colors", rowCls)}>
                      <td className="p-3">
                        <div className="font-medium truncate max-w-[160px]">{b.productName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{b.productSku}</div>
                      </td>
                      <td className="p-3 font-mono text-xs font-semibold">{b.batchNumber}</td>
                      <td className="p-3 text-muted-foreground text-xs">{b.categoryName ?? "—"}</td>
                      <td className="p-3 text-center text-xs">{b.receivedDate}</td>
                      <td className="p-3 text-center">
                        <div className={cn("text-xs font-semibold",
                          b.status === "vencido" ? "text-destructive" : b.status === "por_vencer" ? "text-orange-600" : "")}>
                          {b.expirationDate}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {days < 0 ? `Hace ${Math.abs(days)}d` : days === 0 ? "Hoy" : `En ${days}d`}
                        </div>
                      </td>
                      <td className="p-3 text-center">{b.initialQuantity}</td>
                      <td className="p-3 text-center font-semibold">
                        <span className={b.remainingQuantity === 0 ? "text-muted-foreground" : ""}>{b.remainingQuantity}</span>
                      </td>
                      <td className="p-3 text-right text-xs">{formatCOP(Number(b.costPerUnit))}</td>
                      <td className="p-3 text-right font-medium text-xs">{formatCOP(Number(b.totalValue))}</td>
                      <td className="p-3 text-center">
                        <Badge className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(b)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(b.id)} disabled={!b.active}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Dialog ───────────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lote" : "Registrar nuevo lote"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Producto <span className="text-destructive">*</span></Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm({ ...form, productId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar producto..." /></SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Número de lote <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ej: LOT-2024-001"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="space-y-1">
              <Label>Costo por unidad (COP) <span className="text-destructive">*</span></Label>
              <Input
                type="number" min={0} step={100}
                value={form.costPerUnit || ""}
                onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label>Cantidad inicial <span className="text-destructive">*</span></Label>
              <Input
                type="number" min={1}
                value={form.initialQuantity}
                onChange={(e) => setForm({ ...form, initialQuantity: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label>
                Cantidad restante
                <span className="text-xs text-muted-foreground ml-1">(actual en bodega)</span>
              </Label>
              <Input
                type="number" min={0}
                value={form.remainingQuantity}
                onChange={(e) => setForm({ ...form, remainingQuantity: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label>Fecha de recepción <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={form.receivedDate}
                onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Fecha de vencimiento <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, alert,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn("p-4 flex items-center gap-3", alert && "border-2 border-destructive/30")}>
      <div className={cn("w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-bold text-lg">{value}</div>
      </div>
    </Card>
  );
}
