import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BarChart3, Boxes, Building2, FlaskConical, LayoutDashboard, Layers, Package, Tag, ShoppingCart, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/inventario", label: "Inventario", icon: Boxes },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/categorias", label: "Categorías", icon: Tag },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/centros-costo", label: "Centros de Costo", icon: Building2 },
  { to: "/admin/dependencias", label: "Dependencias", icon: Layers },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/roles", label: "Roles", icon: Shield },
  { to: "/admin/lotes", label: "Lotes/Venc.", icon: FlaskConical },
  { to: "/admin/reportes", label: "Reportes", icon: BarChart3 },
];

function AdminLayout() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin, user, navigate]);

  if (loading || !isAdmin) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <aside className="md:w-56 shrink-0">
          <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase mb-3 px-3">Administración</div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 border-b md:border-b-0 mb-2 md:mb-0">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm whitespace-nowrap transition-colors shrink-0",
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-accent"
                  )}
                >
                  <n.icon className="w-4 h-4 shrink-0" />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
