import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";

// ── Keep-alive: evita que Render hiberne el backend en el plan gratuito ────────
// Hace un GET a /api/ping cada 4 minutos. Render duerme el servicio a los 15 min
// de inactividad; con este intervalo nunca se alcanza ese umbral mientras haya
// al menos una pestaña del frontend abierta.
const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutos

function RootLayout() {
  useEffect(() => {
    const ping = () =>
      fetch("/api/ping", { method: "GET", cache: "no-store" }).catch(() => {});

    ping(); // Primer ping al cargar la app
    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <Toaster richColors position="top-right" />
      </CartProvider>
    </AuthProvider>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundComponent,
});
