import { createFileRoute } from "@tanstack/react-router";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { inventoryApi, type WarehouseStock } from "@/api/inventory";
import { warehousesApi, type Warehouse } from "@/api/warehouses";
import { productsApi, type Product } from "@/api/products";
import { transfersApi } from "@/api/transfers";
import { suppressAuthRedirect } from "@/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCOP } from "@/lib/cart-context";
import { ArrowLeftRight, Download, FileUp, PackageCheck, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inventario")({
  component: InventarioPrincipalPage,
});

// ── CSV helpers ───────────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h] ?? "";
          const s = String(v);
          return s.includes(";") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";")
    ),
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];
  const delim = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delim).map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const vals = line.split(delim).map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

// ── Entry Dialog ──────────────────────────────────────────────────────────────

function EntryDialog({
  warehouseId,
  products,
  initial,
  onClose,
  onSaved,
}: {
  warehouseId: string;
  products: Product[];
  initial?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState(initial ?? "");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!productId || qty <= 0) {
      toast.error("Selecciona producto y cantidad válida");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.recordEntry({ warehouseId, productId, quantity: qty, notes: notes || undefined });
      toast.success("Entrada registrada");
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al registrar entrada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Entrada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Producto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona producto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — SKU {p.sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Adjust Dialog ─────────────────────────────────────────────────────────────

function AdjustDialog({
  warehouseId,
  products,
  initial,
  onClose,
  onSaved,
}: {
  warehouseId: string;
  products: Product[];
  initial?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState(initial ?? "");
  const [type, setType] = useState<"AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO">("AJUSTE_POSITIVO");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!productId || qty <= 0) {
      toast.error("Selecciona producto y cantidad válida");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.adjustStock({ warehouseId, productId, type, quantity: qty, notes: notes || undefined });
      toast.success("Ajuste aplicado");
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al ajustar stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Producto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona producto..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — SKU {p.sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de ajuste</Label>
            <Select value={type} onValueChange={(v) => setType(v as "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AJUSTE_POSITIVO">Ajuste Positivo (+)</SelectItem>
                <SelectItem value="AJUSTE_NEGATIVO">Ajuste Negativo (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo del ajuste..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Aplicando..." : "Aplicar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Transfer Dialog ───────────────────────────────────────────────────────────

type TransferLine = { productId: string; quantity: number };

function TransferDialog({
  mainWarehouse,
  subWarehouses,
  stock,
  onClose,
  onSaved,
}: {
  mainWarehouse: Warehouse;
  subWarehouses: Warehouse[];
  stock: WarehouseStock[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [toId, setToId] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([{ productId: "", quantity: 1 }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const addLine = () => setLines((l) => [...l, { productId: "", quantity: 1 }]);

  const setLine = (i: number, patch: Partial<TransferLine>) =>
    setLines((l) => l.map((ln, idx) => (idx === i ? { ...ln, ...patch } : ln)));

  const removeLine = (i: number) => setLines((l) => l.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!toId) {
      toast.error("Selecciona bodega destino");
      return;
    }
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Agrega al menos un producto con cantidad válida");
      return;
    }
    setSaving(true);
    try {
      await transfersApi.create({
        fromWarehouseId: mainWarehouse.id,
        toWarehouseId: toId,
        notes: notes || undefined,
        items: validLines.map((l) => ({ productId: l.productId, requestedQuantity: l.quantity })),
      });
      toast.success("Traslado creado exitosamente");
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al crear traslado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear Traslado desde Almacén Principal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Origen (fijo)</Label>
              <Input value={mainWarehouse.name} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Destino</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona bodega..." />
                </SelectTrigger>
                <SelectContent>
                  {subWarehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Productos a trasladar</Label>
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select
                  value={line.productId}
                  onValueChange={(v) => setLine(i, { productId: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stock.map((s) => (
                      <SelectItem key={s.productId} value={s.productId}>
                        {s.productName} (Stock: {s.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  className="w-20 shrink-0"
                  onChange={(e) => setLine(i, { quantity: Number(e.target.value) })}
                />
                {lines.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 px-2"
                    onClick={() => removeLine(i)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="w-4 h-4 mr-1" /> Agregar producto
            </Button>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Creando..." : "Crear Traslado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type DialogType = "entry" | "adjust" | "transfer" | null;

function InventarioPrincipalPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stock, setStock]           = useState<WarehouseStock[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");
  const [dialog, setDialog]         = useState<DialogType>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [importing, setImporting]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mainWarehouse = warehouses.find((w) => w.type === "PRINCIPAL");
  const subWarehouses = warehouses.filter((w) => w.type === "SUBBODEGA" && w.active);

  const load = async () => {
    setLoading(true);
    try {
      const whs = await warehousesApi.getAll();
      setWarehouses(whs);
      const main = whs.find((w) => w.type === "PRINCIPAL");
      if (main) {
        const [stockData, productData] = await Promise.all([
          inventoryApi.getStockByWarehouse(main.id),
          productsApi.getAllAdmin(),
        ]);
        setStock(stockData);
        setProducts(productData);
      }
    } catch {
      toast.error("No se pudo cargar el inventario del almacén principal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return stock;
    return stock.filter(
      (s) =>
        s.productName.toLowerCase().includes(term) ||
        s.productSku.toLowerCase().includes(term)
    );
  }, [stock, q]);

  const totals = useMemo(
    () => ({
      items:  stock.length,
      units:  stock.reduce((a, s) => a + s.quantity, 0),
      value:  stock.reduce((a, s) => a + s.quantity * Number(s.productPrice), 0),
      low:    stock.filter((s) => s.lowStock && !s.outOfStock).length,
      outOf:  stock.filter((s) => s.outOfStock).length,
    }),
    [stock]
  );

  const exportCSV = () => {
    const rows = stock.map((s) => ({
      SKU: s.productSku,
      Nombre: s.productName,
      Cantidad: s.quantity,
      PrecioUnitario: s.productPrice,
      ValorTotal: s.quantity * Number(s.productPrice),
      Bodega: s.warehouseName,
    }));
    downloadCSV(`inventario-principal-${new Date().toISOString().split("T")[0]}.csv`, rows);
  };

  const downloadTemplate = () => {
    downloadCSV("plantilla-inventario.csv", [
      { SKU: "PROD-001", Cantidad: 10, Notas: "Entrada inicial" },
    ]);
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mainWarehouse) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setImporting(true);
    suppressAuthRedirect(true);
    let ok = 0;
    let failed = 0;
    let firstError = "";

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("El archivo CSV está vacío o sin datos");
        return;
      }

      for (const row of rows) {
        const sku    = (row["SKU"] ?? row["sku"] ?? "").trim();
        const qtyRaw = row["Cantidad"] ?? row["cantidad"] ?? row["Quantity"] ?? "";
        const qty    = parseInt(String(qtyRaw), 10);
        const notes  = (row["Notas"] ?? row["notas"] ?? row["Notes"] ?? "").trim();

        if (!sku || !Number.isFinite(qty) || qty <= 0) {
          failed++;
          if (!firstError) firstError = `Fila inválida — SKU: "${sku}", Cantidad: "${qtyRaw}"`;
          continue;
        }

        const product = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
        if (!product) {
          failed++;
          if (!firstError) firstError = `SKU no encontrado: "${sku}"`;
          continue;
        }

        try {
          await inventoryApi.recordEntry({
            warehouseId: mainWarehouse.id,
            productId: product.id,
            quantity: qty,
            notes: notes || undefined,
          });
          ok++;
        } catch (err: any) {
          failed++;
          const msg = err?.response?.data?.message ?? String(err);
          if (!firstError) firstError = `SKU ${sku}: ${msg}`;
        }
      }

      if (failed > 0) {
        toast.warning(
          `Importación: ${ok} entradas registradas, ${failed} fallidas` +
            (firstError ? ` — ${firstError}` : "")
        );
      } else {
        toast.success(`Importación completa: ${ok} entradas registradas`);
      }
      await load();
    } catch {
      toast.error("No se pudo leer el archivo CSV");
    } finally {
      suppressAuthRedirect(false);
      setImporting(false);
    }
  };

  const closeDialog = () => {
    setDialog(null);
    setSelectedProductId(undefined);
  };

  const savedAndReload = () => {
    closeDialog();
    load();
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>;
  }

  if (!mainWarehouse) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No se encontró un almacén de tipo PRINCIPAL. Crea uno en el módulo de Bodegas.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {dialog === "entry" && (
        <EntryDialog
          warehouseId={mainWarehouse.id}
          products={products}
          initial={selectedProductId}
          onClose={closeDialog}
          onSaved={savedAndReload}
        />
      )}
      {dialog === "adjust" && (
        <AdjustDialog
          warehouseId={mainWarehouse.id}
          products={products}
          initial={selectedProductId}
          onClose={closeDialog}
          onSaved={savedAndReload}
        />
      )}
      {dialog === "transfer" && (
        <TransferDialog
          mainWarehouse={mainWarehouse}
          subWarehouses={subWarehouses}
          stock={stock}
          onClose={closeDialog}
          onSaved={savedAndReload}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <PackageCheck className="w-6 h-6" />
            Inventario Principal
          </h1>
          <p className="text-sm text-muted-foreground">
            {mainWarehouse.name} — Stock actual, entradas y traslados a sub-bodegas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFileChange}
          />
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1" /> Plantilla
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <FileUp className="w-4 h-4 mr-1" />
            {importing ? "Importando..." : "Importar CSV"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Exportar CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedProductId(undefined);
              setDialog("entry");
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Registrar Entrada
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDialog("transfer")}>
            <ArrowLeftRight className="w-4 h-4 mr-1" /> Crear Traslado
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4">
          <div className="text-xs text-muted-foreground">Productos</div>
          <div className="text-xl sm:text-2xl font-bold">{totals.items}</div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs text-muted-foreground">Unidades totales</div>
          <div className="text-xl sm:text-2xl font-bold">{totals.units}</div>
        </Card>
        <Card className="p-3 sm:p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-muted-foreground">Valor inventario</div>
          <div className="text-sm sm:text-lg font-bold truncate">{formatCOP(totals.value)}</div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs text-muted-foreground">Stock bajo</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{totals.low}</div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs text-muted-foreground">Agotados</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{totals.outOf}</div>
        </Card>
      </div>

      {/* Stock table */}
      <Card className="p-3 sm:p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por SKU o nombre..."
            className="pl-10"
          />
        </div>

        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pl-3 sm:pl-0 pr-3 font-medium">Producto</th>
                <th className="py-2 px-3 font-medium text-right">Stock</th>
                <th className="py-2 px-3 font-medium text-right hidden sm:table-cell">Precio</th>
                <th className="py-2 px-3 font-medium hidden sm:table-cell">Estado</th>
                <th className="py-2 px-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    {stock.length === 0
                      ? "Sin stock registrado en el almacén principal. Registra una entrada para comenzar."
                      : "Sin resultados para la búsqueda."}
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-3 pl-3 sm:pl-0 pr-3">
                    <div className="font-medium truncate max-w-[180px] sm:max-w-none">
                      {s.productName}
                    </div>
                    <div className="text-xs text-muted-foreground">SKU {s.productSku}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">{s.quantity}</td>
                  <td className="py-3 px-3 text-right text-muted-foreground hidden sm:table-cell">
                    {formatCOP(Number(s.productPrice))}
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    {s.outOfStock ? (
                      <Badge variant="destructive">Agotado</Badge>
                    ) : s.lowStock ? (
                      <Badge variant="secondary">Stock bajo</Badge>
                    ) : (
                      <Badge variant="outline">OK</Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProductId(s.productId);
                          setDialog("entry");
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Entrada</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedProductId(s.productId);
                          setDialog("adjust");
                        }}
                      >
                        <span className="text-xs">Ajustar</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
