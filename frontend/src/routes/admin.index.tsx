import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { productsApi } from "@/api/products";
import { ordersApi } from "@/api/orders";
import { usersApi } from "@/api/users";
import { Card } from "@/components/ui/card";
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

type Insight = {
  name: string;
  value: number;
};

function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [byDay, setByDay] = useState<{ date: string; count: number }[]>([]);
  const [byStatus, setByStatus] = useState<{ name: string; value: number }[]>([]);
  const [byCategory, setByCategory] = useState<{ name: string; count: number }[]>([]);
  const [mostRequested, setMostRequested] = useState<Insight | null>(null);
  const [leastRequested, setLeastRequested] = useState<Insight | null>(null);
  const [topArea, setTopArea] = useState<Insight | null>(null);

  useEffect(() => {
    Promise.all([
      productsApi.getAllAdmin(),
      ordersApi.getAllOrders(),
      usersApi.getAll(),
    ]).then(([products, orders, users]) => {
      const revenue = orders
        .filter((o) => o.status === "pagado" || o.status === "entregado")
        .reduce((s, o) => s + Number(o.total), 0);

      setStats({
        products: products.length,
        orders: orders.length,
        users: users.length,
        revenue,
      });

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

      const statusMap: Record<string, number> = {};
      orders.forEach((o) => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
      setByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      const categoryMap: Record<string, number> = {};
      products.forEach((p) => {
        const name = p.categoryName || "Sin categoria";
        categoryMap[name] = (categoryMap[name] ?? 0) + 1;
      });
      setByCategory(
        Object.entries(categoryMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      );

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
          : null
      );

      const usersById = new Map(users.map((user) => [user.id, user]));
      const usersByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]));
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
    }).catch(() => {});
  }, []);

  const tiles = [
    { label: "Productos", value: stats.products, icon: Package, color: "text-primary" },
    { label: "Pedidos", value: stats.orders, icon: ShoppingCart, color: "text-blue-500" },
    { label: "Usuarios", value: stats.users, icon: Users, color: "text-green-500" },
    { label: "Ingresos", value: formatCOP(stats.revenue), icon: TrendingUp, color: "text-amber-500" },
  ];

  const insights = [
    {
      label: "Producto mas pedido",
      value: mostRequested?.name ?? "Sin datos",
      detail: mostRequested ? `${mostRequested.value} unidades` : "Aun no hay pedidos",
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      label: "Producto menos pedido",
      value: leastRequested?.name ?? "Sin datos",
      detail: leastRequested ? `${leastRequested.value} unidades` : "Aun no hay pedidos",
      icon: TrendingDown,
      color: "text-rose-500",
    },
    {
      label: "Area con mas pedidos",
      value: topArea?.name ?? "Sin datos",
      detail: topArea ? `${topArea.value} pedidos` : "Aun no hay pedidos",
      icon: Building2,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

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
    </div>
  );
}
