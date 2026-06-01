import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { inventoryApi, type WarehouseStock, type StockEntryRequest, type AdjustStockRequest, type MovementType } from "@/api/inventory";
import { warehousesApi, type Warehouse } from "@/api/warehouses";
import { productsApi, type Product } from "@/api/products";
import { formatCOP } from "@/lib/cart-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpCircle, Boxes, PackageX, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/stock-bodegas")({
  component: AdminStockBodegas,
});

function AdminStockBodegas() {
  const [warehouses, setWarehouses]   = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh]   = useState<string>("all");
  const [stock, setStock]             = useState<WarehouseStock[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(false);

  // Dialogs
  const [entryOpen, setEntryOpen]     = useState(false);
  const [adjOpen, setAdjOpen]         = useState(false);
  const [entryForm, setEntryForm]     = useState<StockEntryRequest>({ warehouseId: "", productId: "", quantity: 1, notes: "" });
  const [adjForm, setAdjForm]         = useState<AdjustStockRequest>({ warehouseId: "", productId: "", type: "AJUSTE_POSITIVO", quantity: 1, notes: "" });
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    warehousesApi.getAll().then(setWarehouses).catch(() => {});
    productsApi.getAllAdmin().then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const promise = selectedWh === "all"
      ? inventoryApi.getAllStock()
      : inventoryApi.getStockByWarehouse(selectedWh);
    promise.then(setStock).catch(() => {}).finally(() => setLoading(false));
  }, [selectedWh]);

  const reload = () => {
    const promise = selectedWh === "all"
      ? inventoryApi.getAllStock()
      : inventoryApi.getStockByWarehouse(selectedWh);
    promise.then(setStock).catch(() => {});
  };

  const visible = stock.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.productName.toLowerCase().includes(q) || s.productSku.toLowerCase().includes(q);
  });

  const outOfStock = stock.filter((s) => s.outOfStock).length;
  const lowStock   = stock.filter((s) => s.lowStock).length;

  const saveEntry = async () => {
    if (!entryForm.warehouseId) { toast.error("Seleccione la bodega"); return; }
    if (!entryForm.productId)   { toast.error("Seleccione el producto"); return; }
    if ((entryForm.quantity ?? 0) <= 0) { toast.error("Cantidad debe ser mayor a 0"); return; }
    setSaving(true);
    try {
      await inventoryApi.recordEntry(entryForm);
      toast.success("Entrada registrada");
      setEntryOpen(false);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al registrar entrada");
    } finally { setSaving(false); }
  };

  const saveAdj = async () => {
    if (!adjForm.warehouseId) { toast.error("Seleccione la bodega"); return; }
    if (!adjForm.productId)   { toast.error("Seleccione el producto"); return; }
    if ((adjForm.quantity ?? 0) <= 0) { toast.error("Cantidad debe ser mayor a 0"); return; }
    setSaving(true);
    try {
      await inventoryApi.adjustStock(adjForm);
      toast.success("Ajuste registrado");
      setAdjOpen(false);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al ajustar stock");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Boxes className="w-6 h-6" /> Stock por Bodega
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEntryForm({ warehouseId: selectedWh !== "all" ? selectedWh : "", productId: "", quantity: 1, notes: "" }); setEntryOpen(true); }}>
            <ArrowUpCircle className="w-4 h-4 mr-1" /> Entrada
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setAdjForm({ warehouseId: selectedWh !== "all" ? selectedWh : "", productId: "", type: "AJUSTE_POSITIVO", quantity: 1, notes: "" }); setAdjOpen(true); }}>
            <Settings2 className="w-4 h-4 mr-1" /> Ajustar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><div className="text-2xl font-bold">{stock.length}</div><div className="text-xs text-muted-foreground">Registros de stock</div></Card>
        <Card className={cn("p-4 text-center", lowStock > 0 && "border-orange-300")}><div className="text-2xl font-bold text-orange-500">{lowStock}</div><div className="text-xs text-muted-foreground">Stock mínimo</div></Card>
        <Card className={cn("p-4 text-center", outOfStock > 0 && "border-destructive/40")}><div className="text-2xl font-bold text-destructive">{outOfStock}</div><div className="text-xs text-muted-foreground">Agotados</div></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={selectedWh} onValueChange={setSelectedWh}>
          <SelectTrigger className="h-8 text-sm w-52"><SelectValue placeholder="Todas las bodegas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las bodegas</SelectItem>
            {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Buscar producto o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm w-56"
        />
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {visible.length} {visible.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <Card className="p-10 text-center text-muted-foreground">Cargando...</Card>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <PackageX className="w-10 h-10 mx-auto mb-2 opacity-40" />
          {stock.length === 0 ? "Sin registros de stock. Registra una entrada para comenzar." : "Sin resultados."}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 font-semibold">Producto</th>
                  {selectedWh === "all" && <th className="text-left p-3 font-semibold">Bodega</th>}
                  <th className="text-center p-3 font-semibold">Cantidad</th>
                  <th className="text-center p-3 font-semibold">Stock mín.</th>
                  <th className="text-right p-3 font-semibold">Precio unit.</th>
                  <th className="text-center p-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((s) => (
                  <tr key={s.id} className={cn("hover:bg-muted/30 transition-colors",
                    s.outOfStock ? "bg-destructive/5" : s.lowStock ? "bg-orange-50/60 dark:bg-orange-950/10" : "")}>
                    <td className="p-3">
                      <div className="font-medium">{s.productName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{s.productSku}</div>
                    </td>
                    {selectedWh === "all" && <td className="p-3 text-muted-foreground">{s.warehouseName}</td>}
                    <td className="p-3 text-center font-bold text-lg">{s.quantity}</td>
                    <td className="p-3 text-center text-muted-foreground">{s.minimumStock}</td>
                    <td className="p-3 text-right text-xs">{s.productPrice ? formatCOP(Number(s.productPrice)) : "—"}</td>
                    <td className="p-3 text-center">
                      {s.outOfStock ? (
                        <Badge variant="destructive" className="text-xs">Agotado</Badge>
                      ) : s.lowStock ? (
                        <Badge className="text-xs bg-orange-500 text-white">Stock mínimo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Entry Dialog */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle><ArrowUpCircle className="inline w-4 h-4 mr-1" /> Registrar Entrada por Compra</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Bodega <span className="text-destructive">*</span></Label>
              <Select value={entryForm.warehouseId} onValueChange={(v) => setEntryForm({ ...entryForm, warehouseId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar bodega..." /></SelectTrigger>
                <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Producto <span className="text-destructive">*</span></Label>
              <Select value={entryForm.productId} onValueChange={(v) => setEntryForm({ ...entryForm, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto..." /></SelectTrigger>
                <SelectContent>{products.filter((p) => p.active).map((p) => <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cantidad <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} value={entryForm.quantity} onChange={(e) => setEntryForm({ ...entryForm, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Input value={entryForm.notes ?? ""} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>Cancelar</Button>
            <Button onClick={saveEntry} disabled={saving}>{saving ? "Guardando..." : "Registrar entrada"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle><Settings2 className="inline w-4 h-4 mr-1" /> Ajuste de Stock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Bodega <span className="text-destructive">*</span></Label>
              <Select value={adjForm.warehouseId} onValueChange={(v) => setAdjForm({ ...adjForm, warehouseId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar bodega..." /></SelectTrigger>
                <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Producto <span className="text-destructive">*</span></Label>
              <Select value={adjForm.productId} onValueChange={(v) => setAdjForm({ ...adjForm, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto..." /></SelectTrigger>
                <SelectContent>{products.filter((p) => p.active).map((p) => <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo de ajuste <span className="text-destructive">*</span></Label>
              <Select value={adjForm.type} onValueChange={(v) => setAdjForm({ ...adjForm, type: v as MovementType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AJUSTE_POSITIVO">Ajuste Positivo (+)</SelectItem>
                  <SelectItem value="AJUSTE_NEGATIVO">Ajuste Negativo (−)</SelectItem>
                  <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cantidad <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} value={adjForm.quantity} onChange={(e) => setAdjForm({ ...adjForm, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Motivo / Observaciones</Label>
              <Input value={adjForm.notes ?? ""} onChange={(e) => setAdjForm({ ...adjForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjOpen(false)}>Cancelar</Button>
            <Button onClick={saveAdj} disabled={saving}>{saving ? "Guardando..." : "Aplicar ajuste"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
