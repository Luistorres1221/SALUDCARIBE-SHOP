import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { productsApi } from "@/api/products";
import { ordersApi, type Order } from "@/api/orders";
import { usersApi } from "@/api/users";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/cart-context";
import { Building2, Package, ShoppingCart, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const COLORS = [
  "oklch(0.55 0.18 245)",
  "oklch(0.78 0.16 95)",
  "oklch(0.65 0.16 155)",
  "oklch(0.65 0.2 25)",
];

const STATUS_COLOR: Record<string, string> = {
  pendiente: "bg-warning text-warning-foreground",
  aprobado:  "bg-primary text-primary-foreground",
  pagado:    "bg-success text-success-foreground",
  parcial:   "bg-orange-500 text-white",
  entregado: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado:  "Aprobado",
  pagado:    "Pagado",
  parcial:   "Parcial",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

type Insight = { name: string; value: number };
type CCRow   = { name: string; total: number; count: number };

function Dashboard() {
  const [stats, setStats]               = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [byDay, setByDay]               = useState<{ date: string; count: number }[]>([]);
  const [byStatus, setByStatus]         = useState<{ name: string; value: number }[]>([]);
  const [byCategory, setByCategory]     = useState<{ name: string; count: number }[]>([]);
  const [mostRequested, setMostRequested] = useState<Insight | null>(null);
  const [leastRequested, setLeastRequested] = useState<Insight | null>(null);
  const [topArea, setTopArea]           = useState<Insight | null>(null);
  const [byCostCenter, setByCostCenter] = useState<CCRow[]>([]);
  const [allOrders, setAllOrders]       = useState<Order[]>([]);

  useEffect(() => {
    Promise.all([
      productsApi.getAllAdmin(),
      ordersApi.getAllOrders(),
      usersApi.getAll(),
    ]).then(([products, orders, users]) => {
      setAllOrders(orders);

      const revenue = orders
        .filter((o) => o.status === "pagado" || o.status === "entregado")
        .reduce((s, o) => s + Number(o.total), 0);

      setStats({ products: products.length, orders: orders.length, users: users.length, revenue });

      // Pedidos por día
      const days: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      orders.forEach((o) => {
        const k = new Date(o.createdAt).toISOString().slice(0, 10);
        if (k in days) days[k]++;
      });
      setByDay(Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count })));

      // Por estado
      const statusMap: Record<string, number> = {};
      orders.forEach((o) => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
      setByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Productos por categoría
      const categoryMap: Record<string, number> = {};
      products.forEach((p) => {
        const name = p.categoryName || "Sin categoria";
        categoryMap[name] = (categoryMap[name] ?? 0) + 1;
      });
      setByCategory(
        Object.entries(categoryMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      );

      // Productos más/menos pedidos
      const productMap: Record<string, number> = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          productMap[item.productName] = (productMap[item.productName] ?? 0) + item.quantity;
        });
      });
      const productRanking = Object.entries(productMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
      setMostRequested(productRanking[0] ?? null);
      setLeastRequested(
        productRanking.length > 0
          ? [...productRanking].sort((a, b) => a.value - b.value || a.name.localeCompare(b.name))[0]
          : null,
      );

      // Área con más pedidos
      const usersById    = new Map(users.map((u) => [u.id, u]));
      const usersByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
      const areaMap: Record<string, number> = {};
      orders.forEach((order) => {
        const user = usersById.get(order.userId) || usersByEmail.get(order.userEmail.toLowerCase());
        const area = user?.area?.trim() || "Sin area";
        areaMap[area] = (areaMap[area] ?? 0) + 1;
      });
      const areaRanking = Object.entries(areaMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
      setTopArea(areaRanking[0] ?? null);

      // Gasto por centro de costo
      const ccMap: Record<string, { total: number; count: number }> = {};
      orders.forEach((o) => {
        const cc = o.costCenterName?.trim() || "Sin centro de costo";
        if (!ccMap[cc]) ccMap[cc] = { total: 0, count: 0 };
        ccMap[cc].total += Number(o.total);
        ccMap[cc].count += 1;
      });
      setByCostCenter(
        Object.entries(ccMap)
          .map(([name, { total, count }]) => ({ name, total, count }))
          .sort((a, b) => b.total - a.total),
      );
    }).catch(() => {});
  }, []);

  const tiles = [
    { label: "Productos", value: stats.products,        icon: Package,    color: "text-primary"     },
    { label: "Pedidos",   value: stats.orders,           icon: ShoppingCart, color: "text-blue-500"  },
    { label: "Usuarios",  value: stats.users,            icon: Users,      color: "text-green-500"   },
    { label: "Ingresos",  value: formatCOP(stats.revenue), icon: TrendingUp, color: "text-amber-500" },
  ];

  const insights = [
    {
      label: "Producto mas pedido",
      value:  mostRequested?.name ?? "Sin datos",
      detail: mostRequested  ? `${mostRequested.value} unidades`  : "Aun no hay pedidos",
      icon: Trophy,       color: "text-amber-500",
    },
    {
      label: "Producto menos pedido",
      value:  leastRequested?.name ?? "Sin datos",
      detail: leastRequested ? `${leastRequested.value} unidades` : "Aun no hay pedidos",
      icon: TrendingDown, color: "text-rose-500",
    },
    {
      label: "Area con mas pedidos",
      value:  topArea?.name ?? "Sin datos",
      detail: topArea ? `${topArea.value} pedidos` : "Aun no hay pedidos",
      icon: Building2,    color: "text-emerald-600",
    },
  ];

  const ccChartHeight = Math.max(200, byCostCenter.length * 56);

  const orderedByCostCenter = [...allOrders].sort(
    (a, b) =>
      (a.costCenterName ?? "").localeCompare(b.costCenterName ?? "") ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4 flex items-center gap-3 shadow-card">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${t.color}`}>
              <t.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
              <div className="font-bold text-lg">{t.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {insights.map((item) => (
          <Card key={item.label} className="p-4 flex items-start gap-3 shadow-card">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="font-bold text-base truncate">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.detail}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficas generales */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-semibold mb-3">Productos por categoria</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 20, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Productos" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <div className="font-semibold mb-3">Pedidos por dia (ultimos 14)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={COLORS[0]} strokeWidth={2} dot={false} name="Pedidos" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:col-span-2">
          <div className="font-semibold mb-3">Distribucion por estado</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Gasto por Centro de Costo ─────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Gasto por Centro de Costo
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Gráfica de barras */}
          <Card className="p-4">
            <div className="font-semibold mb-3">Total gastado por centro de costo</div>
            {byCostCenter.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">Sin datos aún</div>
            ) : (
              <ResponsiveContainer width="100%" height={ccChartHeight}>
                <BarChart data={byCostCenter} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${(v / 1_000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [formatCOP(Number(value)), "Total"]} />
                  <Bar dataKey="total" name="Total" fill={COLORS[2]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Resumen en lista */}
          <Card className="p-4">
            <div className="font-semibold mb-3">Resumen de centros de costo</div>
            {byCostCenter.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">Sin datos aún</div>
            ) : (
              <div className="space-y-3">
                {byCostCenter.map((cc, i) => (
                  <div key={cc.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-sm font-medium truncate">{cc.name}</span>
                        <span className="text-sm font-bold shrink-0 text-primary">{formatCOP(cc.total)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cc.count} requisición{cc.count !== 1 ? "es" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Tabla detallada de requisiciones por centro de costo */}
      <Card className="p-4">
        <div className="font-semibold mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Detalle de requisiciones por centro de costo
        </div>
        {allOrders.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">Sin requisiciones</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b">
                    <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Centro de costo</th>
                    <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Dependencia</th>
                    <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Requisición</th>
                    <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Fecha</th>
                    <th className="text-left pb-2 pr-3 font-semibold whitespace-nowrap">Solicitante</th>
                    <th className="text-right pb-2 pr-3 font-semibold whitespace-nowrap">Total</th>
                    <th className="text-center pb-2 font-semibold whitespace-nowrap">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderedByCostCenter.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-3 font-medium">
                        {order.costCenterName ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {order.dependencyName ?? "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("es-CO")}
                      </td>
                      <td className="py-2 pr-3 max-w-[140px] truncate">
                        {order.userFullName}
                      </td>
                      <td className="py-2 pr-3 text-right font-bold whitespace-nowrap">
                        {formatCOP(Number(order.total))}
                      </td>
                      <td className="py-2 text-center">
                        <Badge className={`text-xs ${STATUS_COLOR[order.status] ?? ""}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-card border-t">
                  <tr>
                    <td colSpan={5} className="pt-2 text-xs text-muted-foreground">
                      {allOrders.length} requisición{allOrders.length !== 1 ? "es" : ""} en total
                    </td>
                    <td className="pt-2 text-right font-bold">
                      {formatCOP(allOrders.reduce((s, o) => s + Number(o.total), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
