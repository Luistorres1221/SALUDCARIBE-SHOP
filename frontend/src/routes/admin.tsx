import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeftRight, BarChart3, BookOpen, Boxes, BriefcaseBusiness, Building2,
  FlaskConical, LayoutDashboard, Layers, Package, PackageCheck, Tag, ShoppingCart, Users, Shield, Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

// roles: undefined = visible para todos (admin + almacenista); "admin" = solo admin
type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/admin",                label: "Dashboard",        icon: LayoutDashboard, exact: true },
  // ── Módulo Multi-Bodega ─────────────────────────────────────────────
  { to: "/admin/bodegas",        label: "Bodegas",          icon: Warehouse,      adminOnly: true },
  { to: "/admin/stock-bodegas",  label: "Stock Bodegas",    icon: Boxes },
  { to: "/admin/traslados",      label: "Traslados",        icon: ArrowLeftRight },
  { to: "/admin/kardex",         label: "Kardex",           icon: BookOpen },
  { to: "/admin/inventario",     label: "Inv. Principal",   icon: PackageCheck,   adminOnly: true },
  // ── Catálogo y Pedidos ──────────────────────────────────────────────
  { to: "/admin/productos",      label: "Productos",        icon: Package,        adminOnly: true },
  { to: "/admin/categorias",     label: "Categorías",       icon: Tag,            adminOnly: true },
  { to: "/admin/pedidos",        label: "Pedidos",          icon: ShoppingCart },
  { to: "/admin/lotes",          label: "Lotes/Venc.",      icon: FlaskConical },
  // ── Organización ────────────────────────────────────────────────────
  { to: "/admin/centros-costo",  label: "Centros de Costo", icon: Building2,      adminOnly: true },
  { to: "/admin/dependencias",   label: "Dependencias",     icon: Layers,         adminOnly: true },
  { to: "/admin/cargos",         label: "Cargos",           icon: BriefcaseBusiness, adminOnly: true },
  { to: "/admin/usuarios",       label: "Usuarios",         icon: Users,          adminOnly: true },
  { to: "/admin/roles",          label: "Roles",            icon: Shield,         adminOnly: true },
  { to: "/admin/reportes",       label: "Reportes",         icon: BarChart3,      adminOnly: true },
];

function AdminLayout() {
  const { isAdmin, isAlmacenista, loading, user } = useAuth();
  const navigate  = useNavigate();
  const pathname  = useRouterState({ select: (s) => s.location.pathname });

  const hasAccess = isAdmin || isAlmacenista;

  useEffect(() => {
    if (loading) return;
    if (!user)       navigate({ to: "/auth" });
    else if (!hasAccess) navigate({ to: "/" });
  }, [loading, hasAccess, user, navigate]);

  if (loading || !hasAccess) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <aside className="md:w-56 shrink-0">
          <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase mb-3 px-3">
            {isAdmin ? "Administración" : "Almacén"}
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 border-b md:border-b-0 mb-2 md:mb-0">
            {visibleNav.map((n) => {
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
