import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { transfersApi, type Transfer, type TransferStatus, type CreateTransferRequest } from "@/api/transfers";
import { warehousesApi, type Warehouse } from "@/api/warehouses";
import { productsApi, type Product } from "@/api/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeftRight, Check, CheckCircle, ChevronsUpDown, Download, Plus, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/traslados")({
  component: AdminTraslados,
});

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  APROBADO:   { label: "Aprobado",   color: "bg-blue-100 text-blue-800 border-blue-300" },
  RECHAZADO:  { label: "Rechazado",  color: "bg-red-100 text-red-800 border-red-300" },
  DESPACHADO: { label: "Despachado", color: "bg-purple-100 text-purple-800 border-purple-300" },
  RECIBIDO:   { label: "Recibido",   color: "bg-green-100 text-green-800 border-green-300" },
};

const ALL_STATUSES = ["TODOS", "PENDIENTE", "APROBADO", "DESPACHADO", "RECIBIDO", "RECHAZADO"] as const;
type StatusFilter = (typeof ALL_STATUSES)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function lastActivityDate(t: Transfer): string | null {
  return t.receivedAt ?? t.dispatchedAt ?? t.approvedAt ?? t.createdAt ?? null;
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String(r[h] ?? "");
        return v.includes(";") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(";")
    ),
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Timeline component ────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  date?: string | null;
  actor?: string | null;
  done: boolean;
  active: boolean;
}

function TransferTimeline({ t }: { t: Transfer }) {
  const steps: TimelineStep[] = [
    {
      label: "Creado",
      date: t.createdAt,
      actor: t.requestedByName,
      done: true,
      active: t.status === "PENDIENTE",
    },
    {
      label: t.status === "RECHAZADO" ? "Rechazado" : "Aprobado",
      date: t.approvedAt,
      actor: t.approvedByName,
      done: !!t.approvedAt,
      active: t.status === "APROBADO" || t.status === "RECHAZADO",
    },
    {
      label: "Despachado",
      date: t.dispatchedAt,
      actor: t.dispatchedByName,
      done: !!t.dispatchedAt,
      active: t.status === "DESPACHADO",
    },
    {
      label: "Recibido",
      date: t.receivedAt,
      actor: t.receivedByName,
      done: !!t.receivedAt,
      active: t.status === "RECIBIDO",
    },
  ];

  const isRejected = t.status === "RECHAZADO";

  return (
    <div className="relative flex gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const rejected = isRejected && i === 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            {/* connector line */}
            <div className="relative w-full flex items-center">
              <div className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : step.done && !isRejected ? "bg-green-400" : rejected ? "bg-red-300" : "bg-border")} />
              <div className={cn(
                "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 z-10",
                rejected
                  ? "bg-red-100 border-red-400 text-red-600"
                  : step.done
                    ? "bg-green-100 border-green-500 text-green-700"
                    : step.active
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-muted-foreground/30 text-muted-foreground",
              )}>
                {rejected ? "✕" : step.done ? "✓" : i + 1}
              </div>
              <div className={cn("h-0.5 flex-1", isLast ? "opacity-0" : step.done && !isRejected ? "bg-green-400" : "bg-border")} />
            </div>
            {/* label + date */}
            <div className="mt-1.5 text-center px-1">
              <div className={cn(
                "text-xs font-semibold",
                rejected ? "text-red-600" : step.done ? "text-green-700" : step.active ? "text-primary" : "text-muted-foreground",
              )}>
                {step.label}
              </div>
              {step.date && (
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{fmt(step.date)}</div>
              )}
              {step.actor && (
                <div className="text-[10px] text-muted-foreground/70 leading-tight truncate max-w-[80px] mx-auto">
                  {step.actor}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Detail Dialog ─────────────────────────────────────────────────────────────

function DetailDialog({
  t,
  onClose,
  onApprove,
  onDispatch,
  onReceive,
  onReject,
  saving,
}: {
  t: Transfer;
  onClose: () => void;
  onApprove: () => void;
  onDispatch: () => void;
  onReceive: () => void;
  onReject: () => void;
  saving: boolean;
}) {
  const cfg = STATUS_CONFIG[t.status];

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <ArrowLeftRight className="w-5 h-5 shrink-0" />
            {t.fromWarehouseName}
            <span className="text-muted-foreground">→</span>
            {t.toWarehouseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn("px-2.5 py-1 rounded-full text-xs border font-semibold", cfg.color)}>
              {cfg.label}
            </span>
            <span className="text-xs text-muted-foreground">
              Creado el {fmtDate(t.createdAt)}
              {t.requestedByName ? ` por ${t.requestedByName}` : ""}
            </span>
          </div>

          {/* Timeline */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              Línea de tiempo
            </p>
            <TransferTimeline t={t} />
          </div>

          {/* Notes */}
          {t.notes && (
            <div className="text-sm bg-muted/40 p-3 rounded-md">
              <span className="font-medium">Observaciones: </span>{t.notes}
            </div>
          )}
          {t.adminNotes && (
            <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md text-blue-800 dark:text-blue-200">
              <span className="font-medium">Nota admin: </span>{t.adminNotes}
            </div>
          )}

          {/* Items table */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Productos trasladados
            </p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="text-left p-2.5 font-semibold">Producto</th>
                    <th className="text-center p-2.5 font-semibold w-20">Solic.</th>
                    <th className="text-center p-2.5 font-semibold w-20">Aprobado</th>
                    <th className="text-center p-2.5 font-semibold w-20">Despach.</th>
                    <th className="text-center p-2.5 font-semibold w-20">Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {t.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="p-2.5">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">SKU {item.productSku}</div>
                      </td>
                      <td className="p-2.5 text-center">{item.requestedQuantity}</td>
                      <td className="p-2.5 text-center">{item.approvedQuantity ?? "—"}</td>
                      <td className="p-2.5 text-center">{item.dispatchedQuantity ?? "—"}</td>
                      <td className="p-2.5 text-center font-semibold text-green-700">
                        {item.receivedQuantity ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 flex-wrap pt-2">
          {t.status === "PENDIENTE" && (
            <>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={onReject}
                disabled={saving}
              >
                <XCircle className="w-4 h-4 mr-1" /> Rechazar
              </Button>
              <Button onClick={onApprove} disabled={saving}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {saving ? "Aprobando..." : "Aprobar"}
              </Button>
            </>
          )}
          {t.status === "APROBADO" && (
            <Button onClick={onDispatch} disabled={saving}>
              {saving ? "Despachando..." : "Despachar — descontar stock origen"}
            </Button>
          )}
          {t.status === "DESPACHADO" && (
            <Button onClick={onReceive} disabled={saving}>
              {saving ? "Confirmando..." : "Confirmar recepción"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type NewItem = { productId: string; requestedQuantity: number };

function AdminTraslados() {
  const [transfers, setTransfers]   = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [statusFilter, setStatus]   = useState<StatusFilter>("TODOS");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Transfer | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving]         = useState(false);

  // Create form state
  const [fromWh, setFromWh]           = useState("");
  const [toWh, setToWh]               = useState("");
  const [notes, setNotes]             = useState("");
  const [items, setItems]             = useState<NewItem[]>([{ productId: "", requestedQuantity: 1 }]);
  const [openProductIdx, setOpenProductIdx] = useState<number>(-1);

  const load = () => transfersApi.getAll().then(setTransfers).catch(() => {});

  useEffect(() => {
    load();
    warehousesApi.getAll().then(setWarehouses).catch(() => {});
    productsApi.getAllAdmin().then(setProducts).catch(() => {});
  }, []);

  const visible = useMemo(() => {
    let list = statusFilter === "TODOS" ? transfers : transfers.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.fromWarehouseName.toLowerCase().includes(q) ||
          t.toWarehouseName.toLowerCase().includes(q) ||
          t.requestedByName?.toLowerCase().includes(q) ||
          t.items.some((i) => i.productName.toLowerCase().includes(q) || i.productSku.toLowerCase().includes(q))
      );
    }
    return list;
  }, [transfers, statusFilter, search]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        ALL_STATUSES.map((s) => [
          s,
          s === "TODOS" ? transfers.length : transfers.filter((t) => t.status === s).length,
        ])
      ) as Record<StatusFilter, number>,
    [transfers]
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const withSave = async (fn: () => Promise<Transfer>) => {
    setSaving(true);
    try {
      const updated = await fn();
      setTransfers((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al procesar");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = () =>
    withSave(async () => {
      const r = await transfersApi.approve(selected!.id, { adminNotes: "" });
      toast.success("Traslado aprobado");
      return r;
    });

  const handleDispatch = () =>
    withSave(async () => {
      const r = await transfersApi.dispatch(selected!.id);
      toast.success("Despachado — stock descontado del origen");
      return r;
    });

  const handleReceive = () =>
    withSave(async () => {
      const r = await transfersApi.receive(selected!.id);
      toast.success("Recepción confirmada — stock acreditado en destino");
      return r;
    });

  const handleReject = async () => {
    setSaving(true);
    try {
      const updated = await transfersApi.reject(selected!.id, rejectNotes);
      setTransfers((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      setRejectOpen(false);
      toast.success("Traslado rechazado");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────

  const addItem    = () => setItems((p) => [...p, { productId: "", requestedQuantity: 1 }]);
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const setItem    = (i: number, field: keyof NewItem, val: string | number) =>
    setItems((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));

  const handleCreate = async () => {
    if (!fromWh)               { toast.error("Seleccione bodega origen"); return; }
    if (!toWh)                 { toast.error("Seleccione bodega destino"); return; }
    if (fromWh === toWh)       { toast.error("Origen y destino deben ser distintos"); return; }
    if (items.some((i) => !i.productId || i.requestedQuantity <= 0)) {
      toast.error("Complete todos los ítems");
      return;
    }
    setSaving(true);
    try {
      const req: CreateTransferRequest = { fromWarehouseId: fromWh, toWarehouseId: toWh, notes, items };
      const created = await transfersApi.create(req);
      setTransfers((p) => [created, ...p]);
      toast.success("Solicitud de traslado creada");
      setCreateOpen(false);
      setFromWh(""); setToWh(""); setNotes(""); setItems([{ productId: "", requestedQuantity: 1 }]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al crear traslado");
    } finally {
      setSaving(false);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────

  const exportHistory = () => {
    const completed = transfers.filter((t) => t.status === "RECIBIDO");
    const rows: Record<string, unknown>[] = [];
    for (const t of completed) {
      for (const item of t.items) {
        rows.push({
          FechaCreacion:    fmt(t.createdAt),
          FechaAprobacion:  fmt(t.approvedAt),
          FechaDespacho:    fmt(t.dispatchedAt),
          FechaRecepcion:   fmt(t.receivedAt),
          Origen:           t.fromWarehouseName,
          Destino:          t.toWarehouseName,
          SKU:              item.productSku,
          Producto:         item.productName,
          Solicitado:       item.requestedQuantity,
          Aprobado:         item.approvedQuantity ?? "",
          Despachado:       item.dispatchedQuantity ?? "",
          Recibido:         item.receivedQuantity ?? "",
          SolicitadoPor:    t.requestedByName ?? "",
          AprobadoPor:      t.approvedByName ?? "",
          DespachoPor:      t.dispatchedByName ?? "",
          RecibidoPor:      t.receivedByName ?? "",
        });
      }
    }
    downloadCSV(`historial-traslados-${new Date().toISOString().split("T")[0]}.csv`, rows);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6" /> Traslados entre Bodegas
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportHistory}>
            <Download className="w-4 h-4 mr-1" /> Exportar historial
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nueva solicitud
          </Button>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "px-3 py-1 rounded-full text-xs border transition-colors",
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted"
            )}
          >
            {s === "TODOS" ? "Todos" : STATUS_CONFIG[s].label} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por bodega, producto, SKU o usuario..."
          className="w-full h-9 pl-4 pr-4 rounded-md border bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {transfers.length === 0 ? "Sin traslados registrados." : "Sin resultados para el filtro aplicado."}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 font-semibold">Origen → Destino</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Solicitado por</th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">Productos</th>
                  <th className="text-center p-3 font-semibold">Última actividad</th>
                  <th className="text-center p-3 font-semibold">Estado</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((t) => {
                  const cfg = STATUS_CONFIG[t.status];
                  const actDate = lastActivityDate(t);
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelected(t)}
                    >
                      <td className="p-3">
                        <div className="font-medium">{t.fromWarehouseName}</div>
                        <div className="text-xs text-muted-foreground">→ {t.toWarehouseName}</div>
                      </td>
                      <td className="p-3 text-muted-foreground text-sm hidden md:table-cell">
                        {t.requestedByName ?? "—"}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {t.items.slice(0, 2).map((item) => (
                            <div key={item.id}>
                              {item.productName}
                              <span className="ml-1 font-medium text-foreground">
                                ×{item.receivedQuantity ?? item.dispatchedQuantity ?? item.approvedQuantity ?? item.requestedQuantity}
                              </span>
                            </div>
                          ))}
                          {t.items.length > 2 && (
                            <div className="text-muted-foreground/60">+{t.items.length - 2} más</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="text-xs">{fmtDate(actDate)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {t.status === "RECIBIDO" ? "Recibido"
                            : t.status === "DESPACHADO" ? "Despachado"
                            : t.status === "APROBADO" ? "Aprobado"
                            : t.status === "RECHAZADO" ? "Rechazado"
                            : "Creado"}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs border font-medium", cfg.color)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {t.items.length} ítem{t.items.length !== 1 ? "s" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail / history dialog */}
      {selected && !rejectOpen && (
        <DetailDialog
          t={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onDispatch={handleDispatch}
          onReceive={handleReceive}
          onReject={() => { setRejectOpen(true); }}
          saving={saving}
        />
      )}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={(o) => { if (!o) { setRejectOpen(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rechazar traslado</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo del rechazo</Label>
            <Input
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Opcional..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={saving}>
              {saving ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Traslado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Bodega Origen <span className="text-destructive">*</span></Label>
                <Select value={fromWh} onValueChange={setFromWh}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Bodega Destino <span className="text-destructive">*</span></Label>
                <Select value={toWh} onValueChange={setToWh}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {warehouses.filter((w) => w.id !== fromWh).map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional..." />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Productos</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1" /> Agregar
                </Button>
              </div>
              {items.map((item, i) => {
                const selectedProduct = products.find((p) => p.id === item.productId);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Popover
                        open={openProductIdx === i}
                        onOpenChange={(o) => setOpenProductIdx(o ? i : -1)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="h-8 w-full justify-between text-sm font-normal truncate"
                          >
                            <span className="truncate">
                              {selectedProduct
                                ? `${selectedProduct.sku} — ${selectedProduct.name}`
                                : "Buscar producto..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[380px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar por nombre o SKU..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>Sin resultados.</CommandEmpty>
                              {products.filter((p) => p.active).map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={`${p.sku} ${p.name}`}
                                  onSelect={() => {
                                    setItem(i, "productId", p.id);
                                    setOpenProductIdx(-1);
                                  }}
                                >
                                  <Check
                                    className={cn("mr-2 h-4 w-4 shrink-0", item.productId === p.id ? "opacity-100" : "opacity-0")}
                                  />
                                  <span className="font-mono text-xs mr-2 text-muted-foreground">{p.sku}</span>
                                  {p.name}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      className="w-24 h-8 text-sm"
                      value={item.requestedQuantity}
                      onChange={(e) => setItem(i, "requestedQuantity", Number(e.target.value))}
                    />
                    {items.length > 1 && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeItem(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creando..." : "Crear solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
