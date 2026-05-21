import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { categoriesApi, type Category } from "@/api/categories";
import { productsApi, type Product } from "@/api/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Smile, Sparkles, FileText, Package, ArrowRight } from "lucide-react";
import { formatCOP, useCart } from "@/lib/cart-context";
import { resolveImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

const ICONS: Record<string, React.ElementType> = { Stethoscope, Smile, Sparkles, FileText };

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [cats, setCats] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    categoriesApi.getAll().then(setCats).catch(() => {});
    productsApi.getAll().then((list) => setFeatured(list.slice(0, 8))).catch(() => {});
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* Hero */}
      <section className="rounded-2xl gradient-brand p-8 md:p-12 shadow-card">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-foreground">
            Solicita los insumos que tu área necesita
          </h1>
          <p className="mt-3 text-brand-foreground/80">
            Catálogo interno de insumos médicos, odontológicos, aseo y papelería.
            Realiza pedidos en segundos y haz seguimiento de su estado.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild size="lg">
              <Link to="/productos">Explorar productos <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-card/60">
              <Link to="/pedidos"><Package className="w-4 h-4 mr-1" /> Mis pedidos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section>
        <h2 className="text-xl font-bold mb-4">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cats.map((c) => {
            const Icon = (c.icon ? ICONS[c.icon] : null) || Package;
            return (
              <Link key={c.id} to="/productos" search={{ cat: c.slug } as never} className="group">
                <Card className="overflow-hidden shadow-card hover:shadow-lg transition-all hover:-translate-y-0.5 border-border/60">
                  <div className="h-28 bg-muted">
                    {c.imageUrl ? (
                      <img src={resolveImageUrl(c.imageUrl)} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-accent text-accent-foreground flex items-center justify-center group-hover:bg-brand transition-colors">
                        <Icon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Productos destacados</h2>
          <Link to="/productos" className="text-sm text-primary hover:underline">Ver todos</Link>
        </div>
        {featured.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Aún no hay productos.{" "}
            <Link to="/admin" className="text-primary hover:underline">Agrégalos desde el panel admin</Link>.
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <Card key={p.id} className="overflow-hidden shadow-card hover:shadow-lg transition-shadow flex flex-col">
                <div className="aspect-square bg-muted relative">
                  {p.imageUrl ? (
                    <img src={resolveImageUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-xs text-muted-foreground">{p.categoryName}</div>
                  <div className="font-medium line-clamp-2 mt-1">{p.name}</div>
                  <div className="font-bold text-lg mt-2">{formatCOP(Number(p.price))}</div>
                  <div className="text-xs text-muted-foreground mb-2">Stock: {p.stock}</div>
                  <Button size="sm" className="mt-auto" onClick={() => addItem(p.id)}>
                    Agregar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
