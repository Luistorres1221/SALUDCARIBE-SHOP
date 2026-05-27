import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type ComponentType, type ReactNode } from "react";
import { productsApi } from "@/api/products";
import { ordersApi, type Order } from "@/api/orders";
import { costCentersApi } from "@/api/costCenters";
import { dependenciesApi } from "@/api/dependencies";
import { usersApi } from "@/api/users";
import { formatCOP } from "@/lib/cart-context";
import { downloadExcel, downloadPdf, preloadReportAssets, addBrandHeader } from "@/lib/report-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Layers,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { batchesApi } from "@/api/batches";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/admin/reportes")({
  component: Reportes,
});

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado:  "Aprobado",
  pagado:    "Pagado",
  parcial:   "Parcial",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO");
}

function pct(part: number, total: number) {
  if (!total) return "0%";
  return ((part / total) * 100).toFixed(1) + "%";
}

// ── Main component ────────────────────────────────────────────────────────────
function Reportes() {
  const [busy, setBusy]                   = useState<string | null>(null);
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("todos");

  useEffect(() => {
    preloadReportAssets().catch(() => {});
  }, []);

  // ── Filter helper ──────────────────────────────────────────────────────────
  function applyFilter(orders: Order[]) {
    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      if (dateFrom && d < new Date(dateFrom))              return false;
      if (dateTo   && d > new Date(dateTo + "T23:59:59")) return false;
      if (statusFilter !== "todos" && o.status !== statusFilter) return false;
      return true;
    });
  }

  function subtitle() {
    const p: string[] = [];
    if (dateFrom) p.push(`Desde: ${fmtDate(dateFrom)}`);
    if (dateTo)   p.push(`Hasta: ${fmtDate(dateTo)}`);
    if (statusFilter !== "todos") p.push(`Estado: ${STATUS_LABEL[statusFilter]}`);
    return p.join("  |  ") || undefined;
  }

  // ── Runner ─────────────────────────────────────────────────────────────────
  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el reporte");
    } finally {
      setBusy(null);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DATA BUILDERS
  // ══════════════════════════════════════════════════════════════════════════

  // 1 · Consumo por centro de costo
  async function buildConsumoCc() {
    const orders = applyFilter(await ordersApi.getAllOrders());
    const map: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      const k = o.costCenterName?.trim() || "Sin centro de costo";
      (map[k] ??= { count: 0, total: 0 });
      map[k].count++;
      map[k].total += Number(o.total);
    });
    const grandTotal = Object.values(map).reduce((s, v) => s + v.total, 0);
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, { count, total }]) => [
        name, count, formatCOP(total), pct(total, grandTotal),
      ]);
  }

  // 2 · Consumo por dependencia
  async function buildConsumoDep() {
    const orders = applyFilter(await ordersApi.getAllOrders());
    const map: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      const k = o.dependencyName?.trim() || "Sin dependencia";
      (map[k] ??= { count: 0, total: 0 });
      map[k].count++;
      map[k].total += Number(o.total);
    });
    const grandTotal = Object.values(map).reduce((s, v) => s + v.total, 0);
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, { count, total }]) => [
        name, count, formatCOP(total), pct(total, grandTotal),
      ]);
  }

  // 3 · Gastos mensuales
  async function buildGastoMensual() {
    const orders = applyFilter(await ordersApi.getAllOrders());
    const map: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      const d  = new Date(o.createdAt);
      const k  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      (map[k] ??= { count: 0, total: 0 });
      map[k].count++;
      map[k].total += Number(o.total);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { count, total }]) => {
        const [y, m] = key.split("-");
        const label  = `${MONTHS_ES[Number(m) - 1]} ${y}`;
        return [label, count, formatCOP(total)];
      });
  }

  // 4 · Comparativo mensual/anual
  async function buildComparativo() {
    const orders = applyFilter(await ordersApi.getAllOrders());
    const years  = new Set<number>();
    const grid: Record<number, Record<number, number>> = {}; // month -> year -> total

    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const y = d.getFullYear();
      const m = d.getMonth();
      years.add(y);
      (grid[m] ??= {});
      grid[m][y] = (grid[m][y] ?? 0) + Number(o.total);
    });

    const sortedYears = [...years].sort();
    const columns = ["Mes", ...sortedYears.map(String)];
    const rows = MONTHS_ES.map((name, i) =>
      [name, ...sortedYears.map((y) => (grid[i]?.[y] ? formatCOP(grid[i][y]) : "—"))],
    );
    return { columns, rows };
  }

  // 5 · Productos con mayor impacto económico
  async function buildImpactoProducto() {
    const orders = applyFilter(await ordersApi.getAllOrders());
    const map: Record<string, { name: string; qty: number; total: number }> = {};
    orders.forEach((o) =>
      o.items.forEach((it) => {
        (map[it.productId] ??= { name: it.productName, qty: 0, total: 0 });
        map[it.productId].qty   += it.quantity;
        map[it.productId].total += Number(it.subtotal);
      }),
    );
    const grandTotal = Object.values(map).reduce((s, v) => s + v.total, 0);
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .map(({ name, qty, total }) => [name, qty, formatCOP(total), pct(total, grandTotal)]);
  }

  // 6 · Presupuesto ejecutado
  async function buildPresupuesto() {
    const [ccs, orders] = await Promise.all([
      costCentersApi.listAll(),
      ordersApi.getAllOrders(),
    ]);
    const filtered = applyFilter(orders);
    const spent: Record<string, number> = {};
    filtered.forEach((o) => {
      const k = o.costCenterName ?? "Sin CC";
      spent[k] = (spent[k] ?? 0) + Number(o.total);
    });
    return ccs.map((cc) => {
      const consumido     = spent[cc.name] ?? 0;
      const presupuesto   = cc.budget ? Number(cc.budget) : null;
      const disponible    = presupuesto !== null ? presupuesto - consumido : null;
      const pctEjecutado  = presupuesto ? pct(consumido, presupuesto) : "Sin presupuesto";
      return [
        cc.name,
        presupuesto !== null ? formatCOP(presupuesto) : "Sin definir",
        formatCOP(consumido),
        disponible !== null ? formatCOP(disponible) : "—",
        pctEjecutado,
      ];
    });
  }

  // 7 · Pedidos aprobados vs rechazados
  async function buildEstados() {
    const orders = applyFilter(await ordersApi.getAllOrders());
    const map: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      const k = STATUS_LABEL[o.status] ?? o.status;
      (map[k] ??= { count: 0, total: 0 });
      map[k].count++;
      map[k].total += Number(o.total);
    });
    const total = orders.length;
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([status, { count, total: t }]) => [status, count, pct(count, total), formatCOP(t)]);
  }

  // 8 · Costos por categoría
  async function buildCostoCategoria() {
    const [products, orders] = await Promise.all([
      productsApi.getAllAdmin(),
      ordersApi.getAllOrders(),
    ]);
    const filtered = applyFilter(orders);
    const catMap   = new Map(products.map((p) => [p.id, p.categoryName ?? "Sin categoría"]));
    const totals: Record<string, number> = {};
    filtered.forEach((o) =>
      o.items.forEach((it) => {
        const cat    = catMap.get(it.productId) ?? "Sin categoría";
        totals[cat]  = (totals[cat] ?? 0) + Number(it.subtotal);
      }),
    );
    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => [cat, formatCOP(total), pct(total, grandTotal)]);
  }

  // 9 · Rotación de inventario
  async function buildRotacion() {
    const [products, orders] = await Promise.all([
      productsApi.getAllAdmin(),
      ordersApi.getAllOrders(),
    ]);
    const qtyMap: Record<string, number> = {};
    orders.forEach((o) => o.items.forEach((it) => {
      qtyMap[it.productId] = (qtyMap[it.productId] ?? 0) + it.quantity;
    }));
    return products
      .filter((p) => p.active)
      .sort((a, b) => (qtyMap[b.id] ?? 0) - (qtyMap[a.id] ?? 0))
      .map((p) => {
        const pedido = qtyMap[p.id] ?? 0;
        const rot    = pedido === 0 ? "Sin movimiento" : pedido > 20 ? "Alta" : pedido > 5 ? "Media" : "Baja";
        return [p.sku, p.name, p.categoryName ?? "—", pedido, p.stock, rot];
      });
  }

  // 11 · Valorización de inventario
  async function buildValorizacion() {
    const products = await productsApi.getAllAdmin();
    const catMap: Record<string, { count: number; value: number }> = {};
    products.filter((p) => p.active).forEach((p) => {
      const cat = p.categoryName ?? "Sin categoría";
      (catMap[cat] ??= { count: 0, value: 0 });
      catMap[cat].count++;
      catMap[cat].value += Number(p.price) * p.stock;
    });
    const grandTotal = Object.values(catMap).reduce((s, v) => s + v.value, 0);
    return Object.entries(catMap)
      .sort((a, b) => b[1].value - a[1].value)
      .map(([cat, { count, value }]) => [cat, count, formatCOP(value), pct(value, grandTotal)]);
  }

  // 12 · Dashboard gerencial (PDF multi-sección)
  async function buildDashboardGerencial() {
    const [products, orders, users] = await Promise.all([
      productsApi.getAllAdmin(),
      ordersApi.getAllOrders(),
      usersApi.getAll(),
    ]);

    const doc    = new jsPDF({ format: "a4" });
    const pageW  = doc.internal.pageSize.getWidth();
    const margin = 14;

    // ── Encabezado corporativo ────────────────────────────────────────────
    let y = addBrandHeader(doc);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard Gerencial", margin, y);
    y += 8;

    // ── KPIs ─────────────────────────────────────────────────────────────
    const totalGastado = orders.reduce((s, o) => s + Number(o.total), 0);
    const kpis = [
      { label: "Total Pedidos",   val: String(orders.length)   },
      { label: "Total Gastado",   val: formatCOP(totalGastado) },
      { label: "Productos",       val: String(products.length) },
      { label: "Usuarios",        val: String(users.length)    },
    ];
    const boxW = (pageW - margin * 2 - 3) / 4;
    kpis.forEach((kpi, i) => {
      const bx = margin + i * (boxW + 1);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(bx, y, boxW, 18, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text(kpi.label, bx + boxW / 2, y + 7, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(kpi.val, bx + boxW / 2, y + 15, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
    });
    y += 24;

    function sectionTitle(title: string) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(title, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      y += 4;
    }

    function addTable(
      head: string[],
      body: (string | number)[][],
      half?: "left" | "right",
    ) {
      const w = half ? (pageW - margin * 2 - 4) / 2 : pageW - margin * 2;
      const x = half === "right" ? margin + w + 4 : margin;
      autoTable(doc, {
        head: [head],
        body: body.map((r) => r.map(String)),
        startY: y,
        margin: { left: x, right: pageW - x - w },
        tableWidth: w,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      const finalY = (doc as any).lastAutoTable.finalY;
      if (!half || half === "right") y = finalY + 6;
    }

    // Consumo por CC
    sectionTitle("1. Consumo por Centro de Costo");
    const ccMap: Record<string, number> = {};
    orders.forEach((o) => {
      const k = o.costCenterName ?? "Sin CC";
      ccMap[k] = (ccMap[k] ?? 0) + Number(o.total);
    });
    addTable(
      ["Centro de Costo", "Total Consumido"],
      Object.entries(ccMap).sort((a, b) => b[1] - a[1]).map(([n, t]) => [n, formatCOP(t)]),
    );

    // Consumo por Dependencia
    sectionTitle("2. Consumo por Dependencia");
    const depMap: Record<string, number> = {};
    orders.forEach((o) => {
      const k = o.dependencyName ?? "Sin dependencia";
      depMap[k] = (depMap[k] ?? 0) + Number(o.total);
    });
    addTable(
      ["Dependencia", "Total Consumido"],
      Object.entries(depMap).sort((a, b) => b[1] - a[1]).map(([n, t]) => [n, formatCOP(t)]),
    );

    // Gastos mensuales
    sectionTitle("3. Gastos Mensuales");
    const monthMap: Record<string, number> = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[k] = (monthMap[k] ?? 0) + Number(o.total);
    });
    addTable(
      ["Mes", "Total"],
      Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, t]) => {
          const [yr, mo] = key.split("-");
          return [`${MONTHS_ES[Number(mo) - 1]} ${yr}`, formatCOP(t)];
        }),
    );

    // Top 10 productos por impacto
    sectionTitle("4. Top 10 Productos por Impacto Económico");
    const prodMap: Record<string, { name: string; total: number }> = {};
    orders.forEach((o) =>
      o.items.forEach((it) => {
        (prodMap[it.productId] ??= { name: it.productName, total: 0 });
        prodMap[it.productId].total += Number(it.subtotal);
      }),
    );
    addTable(
      ["Producto", "Total Consumido"],
      Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 10)
        .map(({ name, total }) => [name, formatCOP(total)]),
    );

    // Distribución por estado
    sectionTitle("5. Distribución por Estado");
    const stMap: Record<string, number> = {};
    orders.forEach((o) => { stMap[o.status] = (stMap[o.status] ?? 0) + 1; });
    addTable(
      ["Estado", "Cantidad", "Porcentaje"],
      Object.entries(stMap)
        .sort((a, b) => b[1] - a[1])
        .map(([s, c]) => [STATUS_LABEL[s] ?? s, c, pct(c, orders.length)]),
    );

    // Costos por categoría
    sectionTitle("6. Costos por Categoría de Producto");
    const catMap2: Record<string, number> = {};
    const prodCatMap = new Map(products.map((p) => [p.id, p.categoryName ?? "Sin categoría"]));
    orders.forEach((o) =>
      o.items.forEach((it) => {
        const cat  = prodCatMap.get(it.productId) ?? "Sin categoría";
        catMap2[cat] = (catMap2[cat] ?? 0) + Number(it.subtotal);
      }),
    );
    addTable(
      ["Categoría", "Total Consumido"],
      Object.entries(catMap2).sort((a, b) => b[1] - a[1]).map(([c, t]) => [c, formatCOP(t)]),
    );

    // Pedidos pendientes
    const pendientes = orders.filter((o) => o.status === "pendiente").length;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 15; }
    doc.text(`ATENCION: Pedidos pendientes: ${pendientes}`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);

    doc.save("dashboard-gerencial.pdf");
  }

  // 13 · Trazabilidad financiera
  async function buildTrazabilidad() {
    const orders = applyFilter(await ordersApi.getAllOrders());
    return orders.map((o) => {
      const lastDelivery = o.deliveries?.[o.deliveries.length - 1];
      return [
        `#${o.id.slice(0, 8)}`,
        fmtDate(o.createdAt),
        o.userFullName,
        o.userArea ?? "—",
        o.costCenterName ?? "—",
        o.dependencyName ?? "—",
        STATUS_LABEL[o.status] ?? o.status,
        lastDelivery?.adminEmail ?? "—",
        lastDelivery ? fmtDate(lastDelivery.deliveredAt) : "—",
        o.items.length,
        formatCOP(Number(o.total)),
        o.adminNotes ?? "—",
      ];
    });
  }

  // 14 · Eficiencia operativa
  async function buildEficiencia() {
    const orders  = applyFilter(await ordersApi.getAllOrders());
    const total   = orders.length;

    // Por estado
    const stMap: Record<string, number> = {};
    orders.forEach((o) => { stMap[o.status] = (stMap[o.status] ?? 0) + 1; });
    const kpiRows = Object.entries(stMap)
      .sort((a, b) => b[1] - a[1])
      .map(([s, c]) => [STATUS_LABEL[s] ?? s, c, pct(c, total)]);
    kpiRows.unshift(["TOTAL", total, "100%"]);

    // Tiempo promedio creación → última entrega
    const deliveredOrders = orders.filter((o) => o.deliveries?.length > 0);
    let avgDays = 0;
    if (deliveredOrders.length) {
      const sum = deliveredOrders.reduce((acc, o) => {
        const last = o.deliveries[o.deliveries.length - 1];
        return acc + (new Date(last.deliveredAt).getTime() - new Date(o.createdAt).getTime());
      }, 0);
      avgDays = sum / deliveredOrders.length / (1000 * 60 * 60 * 24);
    }

    // Top solicitantes
    const reqMap: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      (reqMap[o.userFullName] ??= { count: 0, total: 0 });
      reqMap[o.userFullName].count++;
      reqMap[o.userFullName].total += Number(o.total);
    });
    const topReq = Object.entries(reqMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, { count, total }]) => [name, count, formatCOP(total)]);

    return { kpiRows, avgDays, topReq };
  }

  // 10 · Pérdidas por vencimiento
  async function buildPerdidasVencimiento() {
    const batches = await batchesApi.listExpired();
    return batches.map((b) => [
      b.productSku,
      b.productName,
      b.categoryName ?? "—",
      b.batchNumber,
      b.expirationDate,
      b.remainingQuantity,
      formatCOP(Number(b.costPerUnit)),
      formatCOP(Number(b.totalValue)),
    ]);
  }

  // 10b · Próximos a vencer (60 días)
  async function buildProximosVencer() {
    const batches = await batchesApi.listExpiringSoon(60);
    return batches.map((b) => [
      b.productSku,
      b.productName,
      b.categoryName ?? "—",
      b.batchNumber,
      b.expirationDate,
      b.remainingQuantity,
      formatCOP(Number(b.costPerUnit)),
      formatCOP(Number(b.totalValue)),
    ]);
  }

  // ── Catálogo maestros ──────────────────────────────────────────────────────
  async function buildProductos() {
    const list = await productsApi.getAllAdmin();
    return list.map((p) => [p.sku, p.name, p.categoryName ?? "—", formatCOP(Number(p.price)), p.stock, p.active ? "Activo" : "Inactivo"]);
  }
  async function buildStockBajo() {
    const list = await productsApi.getAllAdmin();
    return list.filter((p) => p.stock <= 10 && p.active).sort((a, b) => a.stock - b.stock)
      .map((p) => [p.sku, p.name, p.categoryName ?? "—", p.stock, formatCOP(Number(p.price))]);
  }
  async function buildCcs() {
    const list = await costCentersApi.listAll();
    return list.map((c) => [c.code, c.name, c.budget ? formatCOP(Number(c.budget)) : "—", c.active ? "Activo" : "Inactivo"]);
  }
  async function buildDeps() {
    const list = await dependenciesApi.listAll();
    return list.map((d) => [d.code, d.name, d.active ? "Activo" : "Inactivo"]);
  }
  async function buildUsuarios() {
    const list = await usersApi.getAll();
    return list.map((u) => [u.fullName, u.email, u.area ?? "—", u.roles.join(", "), fmtDate(u.createdAt)]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6" /> Reportes
      </h1>

      {/* Filtros */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Filtros para reportes de requisiciones</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Fecha desde</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fecha hasta</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="ghost" className="text-xs"
            onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter("todos"); }}>
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* ── 1. FINANCIERO ─────────────────────────────────────────────────── */}
      <Section title="Financiero" icon={TrendingUp}>
        <ReportCard id="consumo-cc" title="Consumo por Centro de Costo"
          description="Total consumido y % del presupuesto por cada CC. El reporte más importante para control presupuestal."
          icon={Building2} busy={busy}
          onExcel={() => run("excel-consumo-cc", async () => {
            downloadExcel("consumo-cc", [{ name: "Consumo por CC",
              columns: ["Centro de Costo","Nº Req.","Total Consumido","% del Total"],
              rows: await buildConsumoCc() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-consumo-cc", async () => {
            downloadPdf("consumo-cc","Consumo por Centro de Costo",
              ["Centro de Costo","Nº Req.","Total Consumido","% del Total"],
              await buildConsumoCc(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="consumo-dep" title="Consumo por Dependencia"
          description="Total consumido y porcentaje por cada dependencia."
          icon={Layers} busy={busy}
          onExcel={() => run("excel-consumo-dep", async () => {
            downloadExcel("consumo-dep", [{ name: "Por Dependencia",
              columns: ["Dependencia","Nº Req.","Total Consumido","% del Total"],
              rows: await buildConsumoDep() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-consumo-dep", async () => {
            downloadPdf("consumo-dep","Consumo por Dependencia",
              ["Dependencia","Nº Req.","Total Consumido","% del Total"],
              await buildConsumoDep(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="gasto-mensual" title="Gastos Mensuales"
          description="Cuánto se consumió cada mes. Útil para detectar tendencias y planificar compras."
          icon={BarChart3} busy={busy}
          onExcel={() => run("excel-gasto-mensual", async () => {
            downloadExcel("gastos-mensuales", [{ name: "Gastos Mensuales",
              columns: ["Mes","Nº Req.","Total"],
              rows: await buildGastoMensual() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-gasto-mensual", async () => {
            downloadPdf("gastos-mensuales","Gastos Mensuales",
              ["Mes","Nº Req.","Total"], await buildGastoMensual(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="comparativo" title="Comparativo Mensual/Anual"
          description="Gastos mes a mes comparados entre años. Detecta aumentos anormales."
          icon={BarChart3} busy={busy}
          onExcel={() => run("excel-comparativo", async () => {
            const { columns, rows } = await buildComparativo();
            downloadExcel("comparativo-anual", [{ name: "Comparativo", columns, rows }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-comparativo", async () => {
            const { columns, rows } = await buildComparativo();
            downloadPdf("comparativo-anual","Comparativo Mensual/Anual", columns, rows, subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="presupuesto" title="Presupuesto Ejecutado"
          description="Presupuesto vs consumido vs disponible por CC. Configure el presupuesto en cada Centro de Costo."
          icon={Building2} busy={busy}
          onExcel={() => run("excel-presupuesto", async () => {
            downloadExcel("presupuesto-ejecutado", [{ name: "Presupuesto",
              columns: ["Centro de Costo","Presupuesto","Consumido","Disponible","% Ejecutado"],
              rows: await buildPresupuesto() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-presupuesto", async () => {
            downloadPdf("presupuesto-ejecutado","Presupuesto Ejecutado por Centro de Costo",
              ["Centro de Costo","Presupuesto","Consumido","Disponible","% Ejecutado"],
              await buildPresupuesto(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="dashboard-ger" title="Dashboard Gerencial"
          description="PDF ejecutivo multi-sección: KPIs, consumo por CC, tendencia mensual, top productos, costos por categoría y pedidos pendientes."
          icon={BarChart3} busy={busy}
          onPdf={() => run("pdf-dashboard-ger", async () => {
            await buildDashboardGerencial();
            toast.success("Dashboard gerencial descargado");
          })} />
      </Section>

      {/* ── 2. PRODUCTOS E INVENTARIO ─────────────────────────────────────── */}
      <Section title="Productos e Inventario" icon={Package}>
        <ReportCard id="impacto-prod" title="Productos con Mayor Impacto Económico"
          description="Qué productos generan más gasto. Ideal para renegociar precios."
          icon={Package} busy={busy}
          onExcel={() => run("excel-impacto-prod", async () => {
            downloadExcel("impacto-economico", [{ name: "Impacto Económico",
              columns: ["Producto","Cant. Total","Total Consumido","% del Total"],
              rows: await buildImpactoProducto() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-impacto-prod", async () => {
            downloadPdf("impacto-economico","Productos con Mayor Impacto Económico",
              ["Producto","Cant. Total","Total Consumido","% del Total"],
              await buildImpactoProducto(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="costo-cat" title="Costos por Categoría"
          description="Gasto separado por categoría: Médicos, Odontología, Aseo, Papelería."
          icon={Package} busy={busy}
          onExcel={() => run("excel-costo-cat", async () => {
            downloadExcel("costos-por-categoria", [{ name: "Por Categoría",
              columns: ["Categoría","Total Consumido","% del Total"],
              rows: await buildCostoCategoria() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-costo-cat", async () => {
            downloadPdf("costos-por-categoria","Costos por Categoría de Producto",
              ["Categoría","Total Consumido","% del Total"],
              await buildCostoCategoria(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="rotacion" title="Rotación de Inventario"
          description="Qué productos salen rápido y cuáles permanecen almacenados. Reduce sobrecompra."
          icon={Package} busy={busy}
          onExcel={() => run("excel-rotacion", async () => {
            downloadExcel("rotacion-inventario", [{ name: "Rotación",
              columns: ["SKU","Producto","Categoría","Total Pedido","Stock Actual","Rotación"],
              rows: await buildRotacion() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-rotacion", async () => {
            downloadPdf("rotacion-inventario","Rotación de Inventario",
              ["SKU","Producto","Categoría","Total Pedido","Stock Actual","Rotación"],
              await buildRotacion());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="valorizacion" title="Valorización de Inventario"
          description="Cuánto dinero hay almacenado en inventario, agrupado por categoría."
          icon={Package} busy={busy}
          onExcel={() => run("excel-valorizacion", async () => {
            downloadExcel("valorizacion-inventario", [{ name: "Valorización",
              columns: ["Categoría","Nº Productos","Valor Almacenado","% del Total"],
              rows: await buildValorizacion() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-valorizacion", async () => {
            downloadPdf("valorizacion-inventario","Valorización de Inventario",
              ["Categoría","Nº Productos","Valor Almacenado","% del Total"],
              await buildValorizacion());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="perdidas-venc" title="Pérdidas por Vencimiento"
          description="Lotes vencidos con stock disponible. Muestra valor económico de los productos perdidos."
          icon={XCircle} busy={busy}
          onExcel={() => run("excel-perdidas-venc", async () => {
            const rows = await buildPerdidasVencimiento();
            if (!rows.length) { toast.info("No hay lotes vencidos con stock"); return; }
            downloadExcel("perdidas-por-vencimiento", [{ name: "Pérdidas",
              columns: ["SKU","Producto","Categoría","Lote","F. Vencimiento","Uds. Restantes","Costo/u","Valor Perdido"],
              rows }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-perdidas-venc", async () => {
            const rows = await buildPerdidasVencimiento();
            if (!rows.length) { toast.info("No hay lotes vencidos con stock"); return; }
            downloadPdf("perdidas-por-vencimiento","Pérdidas por Vencimiento",
              ["SKU","Producto","Categoría","Lote","F. Venc.","Uds.","Costo/u","Valor Perdido"], rows);
            toast.success("PDF descargado");
          })} />

        <ReportCard id="proximos-venc" title="Próximos a Vencer (60 días)"
          description="Lotes con fecha de vencimiento en los próximos 60 días. Permite tomar decisiones antes de la pérdida."
          icon={CalendarClock} busy={busy}
          onExcel={() => run("excel-proximos-venc", async () => {
            const rows = await buildProximosVencer();
            if (!rows.length) { toast.info("No hay lotes próximos a vencer"); return; }
            downloadExcel("proximos-a-vencer", [{ name: "Por Vencer",
              columns: ["SKU","Producto","Categoría","Lote","F. Vencimiento","Uds. Restantes","Costo/u","Valor en Riesgo"],
              rows }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-proximos-venc", async () => {
            const rows = await buildProximosVencer();
            if (!rows.length) { toast.info("No hay lotes próximos a vencer"); return; }
            downloadPdf("proximos-a-vencer","Lotes Próximos a Vencer (60 días)",
              ["SKU","Producto","Categoría","Lote","F. Venc.","Uds.","Costo/u","Valor en Riesgo"], rows);
            toast.success("PDF descargado");
          })} />

        <ReportCard id="stock-bajo" title="Productos con Stock Bajo"
          description="Activos con 10 o menos unidades. Alertas de recompra."
          icon={AlertTriangle} busy={busy}
          onExcel={() => run("excel-stock-bajo", async () => {
            const rows = await buildStockBajo();
            if (!rows.length) { toast.warning("No hay productos con stock bajo"); return; }
            downloadExcel("stock-bajo",[{ name: "Stock Bajo",
              columns: ["SKU","Producto","Categoría","Stock","Precio (COP)"], rows }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-stock-bajo", async () => {
            const rows = await buildStockBajo();
            if (!rows.length) { toast.warning("No hay productos con stock bajo"); return; }
            downloadPdf("stock-bajo","Productos con Stock Bajo",
              ["SKU","Producto","Categoría","Stock","Precio (COP)"], rows);
            toast.success("PDF descargado");
          })} />
      </Section>

      {/* ── 3. OPERATIVO ──────────────────────────────────────────────────── */}
      <Section title="Operativo" icon={Zap}>
        <ReportCard id="trazabilidad" title="Trazabilidad Financiera"
          description="Quién pidió, quién entregó, qué se entregó y cuánto costó. Esencial para auditorías."
          icon={ClipboardList} busy={busy}
          onExcel={() => run("excel-trazabilidad", async () => {
            downloadExcel("trazabilidad", [{ name: "Trazabilidad",
              columns: ["ID","Fecha","Solicitante","Área","CC","Dependencia","Estado","Entregado por","Fecha entrega","Items","Total (COP)","Observaciones"],
              rows: await buildTrazabilidad() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-trazabilidad", async () => {
            downloadPdf("trazabilidad","Trazabilidad Financiera de Requisiciones",
              ["ID","Fecha","Solicitante","Área","CC","Dep.","Estado","Entregó","F.Entrega","Items","Total","Obs."],
              await buildTrazabilidad(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="estados" title="Pedidos Aprobados vs Rechazados"
          description="Distribución de pedidos por estado. Mide el flujo operativo y el control administrativo."
          icon={ShoppingCart} busy={busy}
          onExcel={() => run("excel-estados", async () => {
            downloadExcel("estados-pedidos", [{ name: "Por Estado",
              columns: ["Estado","Cantidad","Porcentaje","Total Consumido"],
              rows: await buildEstados() }]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-estados", async () => {
            downloadPdf("estados-pedidos","Pedidos por Estado",
              ["Estado","Cantidad","Porcentaje","Total Consumido"],
              await buildEstados(), subtitle());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="eficiencia" title="Eficiencia Operativa"
          description="KPIs operativos: distribución por estado, tiempo promedio de entrega y top 10 solicitantes."
          icon={Zap} busy={busy}
          onExcel={() => run("excel-eficiencia", async () => {
            const { kpiRows, avgDays, topReq } = await buildEficiencia();
            downloadExcel("eficiencia-operativa", [
              { name: "KPIs", columns: ["Indicador","Cantidad","Porcentaje"], rows: [
                ...kpiRows,
                ["Tiempo prom. entrega (días)", avgDays.toFixed(1), ""],
              ]},
              { name: "Top Solicitantes", columns: ["Solicitante","Nº Pedidos","Total Consumido"], rows: topReq },
            ]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-eficiencia", async () => {
            const { kpiRows, avgDays, topReq } = await buildEficiencia();
            const doc = new jsPDF();
            let y2 = addBrandHeader(doc);
            doc.setFontSize(12); doc.setFont("helvetica", "bold");
            doc.text("Eficiencia Operativa", 14, y2); y2 += 7;
            doc.setFontSize(9); doc.setFont("helvetica", "normal");
            doc.text(`Tiempo promedio de entrega: ${avgDays.toFixed(1)} días`, 14, y2); y2 += 6;
            autoTable(doc, {
              head: [["Indicador","Cantidad","Porcentaje"]],
              body: kpiRows.map(r => r.map(String)),
              startY: y2, styles: { fontSize: 8 },
              headStyles: { fillColor: [37, 99, 235] },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              margin: { left: 14, right: 14 },
            });
            const y3 = (doc as any).lastAutoTable.finalY + 6;
            doc.setFontSize(9); doc.setFont("helvetica","bold");
            doc.text("Top 10 Solicitantes", 14, y3);
            autoTable(doc, {
              head: [["Solicitante","Nº Pedidos","Total Consumido"]],
              body: topReq.map(r => r.map(String)),
              startY: y3 + 4, styles: { fontSize: 8 },
              headStyles: { fillColor: [37, 99, 235] },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              margin: { left: 14, right: 14 },
            });
            doc.save("eficiencia-operativa.pdf");
            toast.success("PDF descargado");
          })} />
      </Section>

      {/* ── 4. DATOS MAESTROS ─────────────────────────────────────────────── */}
      <Section title="Datos Maestros" icon={ClipboardList}>
        <ReportCard id="catalogo" title="Catálogo de Productos"
          description="Lista completa de productos con SKU, precio, stock y estado."
          icon={Package} busy={busy}
          onExcel={() => run("excel-catalogo", async () => {
            downloadExcel("catalogo-productos",[{name:"Productos",
              columns:["SKU","Nombre","Categoría","Precio (COP)","Stock","Estado"],
              rows: await buildProductos()}]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-catalogo", async () => {
            downloadPdf("catalogo-productos","Catálogo de Productos",
              ["SKU","Nombre","Categoría","Precio (COP)","Stock","Estado"],
              await buildProductos());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="cc-maestro" title="Centros de Costo"
          description="Lista de centros de costo con código, presupuesto y estado."
          icon={Building2} busy={busy}
          onExcel={() => run("excel-cc-maestro", async () => {
            downloadExcel("centros-costo",[{name:"Centros de Costo",
              columns:["Código","Nombre","Presupuesto","Estado"],
              rows: await buildCcs()}]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-cc-maestro", async () => {
            downloadPdf("centros-costo","Centros de Costo",
              ["Código","Nombre","Presupuesto","Estado"],
              await buildCcs());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="dep-maestro" title="Dependencias"
          description="Lista de todas las dependencias con código y estado."
          icon={Layers} busy={busy}
          onExcel={() => run("excel-dep-maestro", async () => {
            downloadExcel("dependencias",[{name:"Dependencias",
              columns:["Código","Nombre","Estado"],
              rows: await buildDeps()}]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-dep-maestro", async () => {
            downloadPdf("dependencias","Dependencias",
              ["Código","Nombre","Estado"], await buildDeps());
            toast.success("PDF descargado");
          })} />

        <ReportCard id="usuarios" title="Lista de Usuarios"
          description="Todos los usuarios del sistema con roles, área y fecha de registro."
          icon={Users} busy={busy}
          onExcel={() => run("excel-usuarios", async () => {
            downloadExcel("usuarios",[{name:"Usuarios",
              columns:["Nombre","Email","Área","Roles","Fecha Registro"],
              rows: await buildUsuarios()}]);
            toast.success("Excel descargado");
          })}
          onPdf={() => run("pdf-usuarios", async () => {
            downloadPdf("usuarios","Lista de Usuarios",
              ["Nombre","Email","Área","Roles","Fecha Registro"],
              await buildUsuarios());
            toast.success("PDF descargado");
          })} />
      </Section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, children,
}: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </section>
  );
}

type ReportCardProps = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  busy: string | null;
  onExcel?: () => void;
  onPdf?: () => void;
};

function ReportCard({ id, title, description, icon: Icon, busy, onExcel, onPdf }: ReportCardProps) {
  const excelBusy = busy === `excel-${id}`;
  const pdfBusy   = busy === `pdf-${id}`;
  const anyBusy   = busy !== null;

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        {onExcel && (
          <Button size="sm" variant="outline"
            className="flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            onClick={onExcel} disabled={anyBusy}>
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            {excelBusy ? "Generando..." : "Excel"}
          </Button>
        )}
        {onPdf && (
          <Button size="sm" variant="outline"
            className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
            onClick={onPdf} disabled={anyBusy}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            {pdfBusy ? "Generando..." : "PDF"}
          </Button>
        )}
      </div>
    </Card>
  );
}

