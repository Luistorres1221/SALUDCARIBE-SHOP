import { createFileRoute } from "@tanstack/react-router";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { categoriesApi, type Category } from "@/api/categories";
import { productsApi, type Product, type ProductRequest } from "@/api/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/cart-context";
import { Download, Package, Save, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/inventario")({
  component: InventoryPage,
});

type Draft = {
  price: number;
  stock: number;
};

type ImportRow = Record<string, unknown>;

const readText = (row: ImportRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
};

const readNumber = (row: ImportRow, keys: string[]) => {
  const raw = readText(row, keys).replace(/\$/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
};

function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [productList, categoryList] = await Promise.all([
      productsApi.getAllAdmin(),
      categoriesApi.getAll(),
    ]);
    setProducts(productList);
    setCategories(categoryList);
    setDrafts(Object.fromEntries(
      productList.map((p) => [p.id, { price: Number(p.price), stock: p.stock }])
    ));
  };

  useEffect(() => {
    load().catch(() => toast.error("No se pudo cargar el inventario"));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.categoryName?.toLowerCase().includes(term)
    );
  }, [products, q]);

  const totals = useMemo(() => {
    const active = products.filter((p) => p.active);
    const units = active.reduce((sum, p) => sum + p.stock, 0);
    const value = active.reduce((sum, p) => sum + Number(p.price) * p.stock, 0);
    const lowStock = active.filter((p) => p.stock <= 5).length;
    return { active: active.length, units, value, lowStock };
  }, [products]);

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveProduct = async (product: Product) => {
    const draft = drafts[product.id];
    if (!draft) return;
    setSavingId(product.id);
    try {
      const payload: ProductRequest = {
        sku: product.sku,
        name: product.name,
        description: product.description ?? "",
        price: draft.price,
        stock: draft.stock,
        imageUrl: product.imageUrl ?? undefined,
        categoryId: product.categoryId ?? undefined,
      };
      const saved = await productsApi.update(product.id, payload);
      setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      toast.success("Inventario actualizado");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "No se pudo actualizar");
    } finally {
      setSavingId(null);
    }
  };

  const exportXLSX = () => {
    const rows = products.map((p) => ({
      SKU: p.sku,
      Nombre: p.name,
      Descripcion: p.description ?? "",
      Precio: Number(p.price),
      Stock: p.stock,
      Categoria: p.categoryName ?? "",
      CategoriaId: p.categoryId ?? "",
      Imagen: p.imageUrl ?? "",
      Activo: p.active ? "SI" : "NO",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario-productos.xlsx");
  };

  const resolveCategoryId = (row: ImportRow) => {
    const categoryId = readText(row, ["CategoriaId", "categoryId", "categoriaId"]);
    if (categoryId) return categoryId;

    const name = readText(row, ["Categoria", "Categoría", "category", "categoria"]).toLowerCase();
    if (!name) return "";

    return categories.find((c) =>
      c.name.toLowerCase() === name ||
      c.slug.toLowerCase() === name ||
      c.id.toLowerCase() === name
    )?.id ?? "";
  };

  const importXLSX = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
      let created = 0;
      let updated = 0;

      for (const row of rows) {
        const sku = readText(row, ["SKU", "sku"]);
        const name = readText(row, ["Nombre", "name", "Producto"]);
        if (!sku || !name) continue;

        const existing = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
        const categoryId = resolveCategoryId(row);
        const imageUrl = readText(row, ["Imagen", "imageUrl", "ImagenUrl", "URL Imagen"]);
        const payload: ProductRequest = {
          sku,
          name,
          description: readText(row, ["Descripcion", "Descripción", "description"]),
          price: readNumber(row, ["Precio", "price"]),
          stock: Math.max(0, Math.trunc(readNumber(row, ["Stock", "stock", "Inventario"]))),
          categoryId: categoryId || undefined,
          imageUrl: imageUrl || undefined,
        };

        if (existing) {
          await productsApi.update(existing.id, payload);
          updated++;
        } else {
          await productsApi.create(payload);
          created++;
        }
      }

      await load();
      toast.success(`Importacion completa: ${created} creados, ${updated} actualizados`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "No se pudo importar el archivo");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground">Gestion de stock, costos e importacion masiva de productos.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importXLSX} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4 mr-1" /> {importing ? "Importando..." : "Importar Excel"}
          </Button>
          <Button variant="outline" onClick={exportXLSX}>
            <Download className="w-4 h-4 mr-1" /> Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Productos activos</div>
          <div className="text-2xl font-bold">{totals.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Unidades en stock</div>
          <div className="text-2xl font-bold">{totals.units}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Valor inventario</div>
          <div className="text-2xl font-bold">{formatCOP(totals.value)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Stock bajo</div>
          <div className="text-2xl font-bold">{totals.lowStock}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por SKU, producto o categoria..." className="pl-10" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Producto</th>
                <th className="py-2 px-3 font-medium">Categoria</th>
                <th className="py-2 px-3 font-medium w-32">Precio</th>
                <th className="py-2 px-3 font-medium w-28">Stock</th>
                <th className="py-2 px-3 font-medium">Estado</th>
                <th className="py-2 pl-3 font-medium text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const draft = drafts[p.id] ?? { price: Number(p.price), stock: p.stock };
                return (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3 min-w-64">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">SKU {p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{p.categoryName ?? "Sin categoria"}</td>
                    <td className="py-3 px-3">
                      <Input type="number" min={0} value={draft.price} onChange={(e) => updateDraft(p.id, { price: Number(e.target.value) })} />
                    </td>
                    <td className="py-3 px-3">
                      <Input type="number" min={0} value={draft.stock} onChange={(e) => updateDraft(p.id, { stock: Number(e.target.value) })} />
                    </td>
                    <td className="py-3 px-3">
                      {draft.stock <= 0 ? <Badge variant="destructive">Agotado</Badge> : draft.stock <= 5 ? <Badge variant="secondary">Bajo</Badge> : <Badge variant="outline">Disponible</Badge>}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <Button size="sm" onClick={() => saveProduct(p)} disabled={savingId === p.id}>
                        <Save className="w-4 h-4 mr-1" /> Guardar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
