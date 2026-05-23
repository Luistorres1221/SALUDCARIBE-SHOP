import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, LogOut, LayoutDashboard, Package, Search, User as UserIcon } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, FormEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [q, setQ] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/productos", search: { q: q || undefined } as never });
  };

  if (pathname === "/auth") return null;

  return (
    <header className="sticky top-0 z-40 gradient-brand border-b border-border/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoImg} alt="SaludCaribe Shop" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-white ring-2 ring-white/40 shadow-md" />
          <span className="font-bold text-base sm:text-lg text-brand-foreground hidden sm:inline tracking-tight">SaludCaribe<span className="opacity-80 font-medium"> Shop</span></span>
        </Link>

        <form onSubmit={onSearch} className="flex-1 min-w-0 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-3 sm:pr-4 rounded-md bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        {user ? (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isAdmin && (
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-brand-foreground hover:bg-card/40">
                <Link to="/admin">
                  <LayoutDashboard className="w-4 h-4 mr-1" /> Admin
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="text-brand-foreground hover:bg-card/40">
              <Link to="/pedidos">
                <Package className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Pedidos</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative text-brand-foreground hover:bg-card/40">
              <Link to="/carrito">
                <ShoppingCart className="w-5 h-5" />
                {count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                    {count}
                  </Badge>
                )}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-brand-foreground hover:bg-card/40">
                  <UserIcon className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 max-w-[90vw]">
                <DropdownMenuLabel>
                  <div className="font-medium">{user.fullName || user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  <div className="text-xs mt-1 flex flex-wrap gap-1">
                    {(user.roles ?? []).map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {ROLE_LABELS[r]}
                      </Badge>
                    ))}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/pedidos" })}>
                  Mis pedidos
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    Panel admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { signOut(); navigate({ to: "/auth" }); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Iniciar sesión</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
