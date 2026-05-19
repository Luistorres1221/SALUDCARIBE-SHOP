import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart, formatCOP } from "@/lib/cart-context";
import { categoriesApi, type Category } from "@/api/categories";
import { productsApi, type Product } from "@/api/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/productos")({
  validateSearch: (s: Record<string, unknown>): { q?: string; cat?: string; avail?: string } => ({
    q: (s.q as string) || undefined,
    cat: (s.cat as string) || undefined,
    avail: (s.avail as string) || undefined,
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { addItem } = useCart();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    categoriesApi.getAll().then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    const catObj = cats.find((c) => c.slug === search.cat);
    productsApi
      .getAll({ q: search.q, categoryId: catObj?.id })
      .then((list) => {
        if (search.avail === "in") list = list.filter((p) => p.stock > 0);
        setProducts(list);
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [user, search.q, search.cat, search.avail, cats]);

  const update = (patch: Partial<typeof search>) =>
    navigate({ to: "/productos", search: { ...search, ...patch } as never });

  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <aside className="md:w-64 shrink-0 space-y-4">
          <Card className="p-4">
            <div className="font-semibold mb-3">Filtros</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Categoría</label>
                <Select value={search.cat || "all"} onValueChange={(v) => update({ cat: v === "all" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {cats.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Disponibilidad</label>
                <Select value={search.avail || "all"} onValueChange={(v) => update({ avail: v === "all" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="in">En stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search.q ?? ""}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Buscar productos..."
                className="pl-10"
              />
            </div>
            {(search.q || search.cat || search.avail) && (
              <Button variant="ghost" onClick={() => navigate({ to: "/productos", search: {} as never })}>
                Limpiar
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            {busy ? "Cargando..." : `${products.length} resultados`}
          </div>

          {products.length === 0 && !busy ? (
            <Card className="p-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              No se encontraron productos.
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Card key={p.id} className="overflow-hidden shadow-card hover:shadow-lg transition-shadow flex flex-col">
                  <div className="aspect-square bg-muted relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    {p.stock === 0 && (
                      <Badge variant="destructive" className="absolute top-2 right-2">Agotado</Badge>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="text-xs text-muted-foreground">{p.categoryName} · SKU {p.sku}</div>
                    <div className="font-medium line-clamp-2 mt-1">{p.name}</div>
                    <div className="font-bold text-lg mt-2">{formatCOP(Number(p.price))}</div>
                    <div className="text-xs text-muted-foreground mb-2">Stock: {p.stock}</div>
                    <Button size="sm" className="mt-auto" disabled={p.stock === 0} onClick={() => addItem(p.id)}>
                      Agregar al carrito
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
