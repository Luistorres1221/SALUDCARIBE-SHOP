import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { inventoryApi, type InventoryMovement, type MovementType, MOVEMENT_LABELS } from "@/api/inventory";
import { warehousesApi, type Warehouse } from "@/api/warehouses";
import { productsApi, type Product } from "@/api/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/kardex")({
  component: AdminKardex,
});

const MOVEMENT_COLORS: Record<MovementType, string> = {
  ENTRADA_COMPRA:   "text-green-600",
  SALIDA_ENTREGA:   "text-red-600",
  TRASLADO_SALIDA:  "text-orange-600",
  TRASLADO_ENTRADA: "text-blue-600",
  AJUSTE_POSITIVO:  "text-emerald-600",
  AJUSTE_NEGATIVO:  "text-rose-600",
  DEVOLUCION:       "text-purple-600",
};

function AdminKardex() {
  const [movements, setMovements]   = useState<InventoryMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [selectedWh, setSelectedWh] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    warehousesApi.getAll().then(setWarehouses).catch(() => {});
    productsApi.getAllAdmin().then(setProducts).catch(() => {});
  }, []);

  useEffect(() => { loadMovements(); }, [selectedWh, selectedProduct]);

  const loadMovements = () => {
    setLoading(true);
    let promise: Promise<InventoryMovement[]>;
    if (selectedProduct !== "all") {
      promise = inventoryApi.getKardex(selectedProduct, selectedWh !== "all" ? selectedWh : undefined);
    } else if (selectedWh !== "all") {
      promise = inventoryApi.getMovementsByWarehouse(selectedWh);
    } else {
      promise = inventoryApi.getAllMovements();
    }
    promise.then(setMovements).catch(() => toast.error("Error al cargar movimientos")).finally(() => setLoading(false));
  };

  const visible = movements.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.productName.toLowerCase().includes(q) || m.productSku.toLowerCase().includes(q)
        || m.warehouseName.toLowerCase().includes(q) || (m.typeLabel ?? "").toLowerCase().includes(q);
  });

  const fmt = (d?: string) => d ? new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—";

  const exportCSV = () => {
    const headers = ["Fecha", "Bodega", "Producto", "SKU", "Tipo", "Cantidad", "Stock Anterior", "Stock Nuevo", "Referencia", "Registrado por", "Notas"];
    const rows = visible.map((m) => [
      fmt(m.createdAt), m.warehouseName, m.productName, m.productSku,
      m.typeLabel, m.quantity, m.previousStock, m.newStock,
      m.referenceType ?? "", m.createdByName ?? "", m.notes ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kardex-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kardex exportado");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Kardex — Historial de Movimientos
        </h1>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={visible.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={selectedWh} onValueChange={setSelectedWh}>
          <SelectTrigger className="h-8 text-sm w-48"><SelectValue placeholder="Todas las bodegas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las bodegas</SelectItem>
            {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="h-8 text-sm w-56"><SelectValue placeholder="Todos los productos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2 top-1.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm pl-7 w-44"
          />
        </div>
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {visible.length} movimiento{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(MOVEMENT_LABELS) as [MovementType, string][]).map(([type, label]) => (
          <span key={type} className={cn("flex items-center gap-1", MOVEMENT_COLORS[type])}>
            <span className="w-2 h-2 rounded-full bg-current inline-block" />
            {label}
          </span>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <Card className="p-10 text-center text-muted-foreground">Cargando movimientos...</Card>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Sin movimientos registrados.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 font-semibold">Fecha</th>
                  <th className="text-left p-3 font-semibold">Bodega</th>
                  <th className="text-left p-3 font-semibold">Producto</th>
                  <th className="text-center p-3 font-semibold">Tipo</th>
                  <th className="text-center p-3 font-semibold">Cantidad</th>
                  <th className="text-center p-3 font-semibold">Anterior</th>
                  <th className="text-center p-3 font-semibold">Nuevo</th>
                  <th className="text-left p-3 font-semibold">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{fmt(m.createdAt)}</td>
                    <td className="p-3 text-xs">{m.warehouseName}</td>
                    <td className="p-3">
                      <div className="font-medium text-xs">{m.productName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{m.productSku}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn("text-xs font-medium", MOVEMENT_COLORS[m.type])}>{m.typeLabel}</span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={cn(
                        ["ENTRADA_COMPRA", "TRASLADO_ENTRADA", "AJUSTE_POSITIVO", "DEVOLUCION"].includes(m.type) ? "text-green-600" : "text-red-600"
                      )}>
                        {["ENTRADA_COMPRA", "TRASLADO_ENTRADA", "AJUSTE_POSITIVO", "DEVOLUCION"].includes(m.type) ? "+" : "−"}{m.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{m.previousStock}</td>
                    <td className="p-3 text-center font-semibold">{m.newStock}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      <div>{m.createdByName ?? "—"}</div>
                      {m.notes && <div className="text-xs opacity-70 truncate max-w-[120px]">{m.notes}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
