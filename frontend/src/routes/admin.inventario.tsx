import { createFileRoute } from "@tanstack/react-router";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { categoriesApi, type Category } from "@/api/categories";
import { productsApi, type Product, type ProductRequest } from "@/api/products";
import { suppressAuthRedirect } from "@/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCOP } from "@/lib/cart-context";
import { Download, FileUp, Save, Search } from "lucide-react";
import { ProductImg } from "@/components/ProductImg";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/inventario")({
  component: InventoryPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Draft = { price: number; stock: number };
type ImportRow = Record<string, unknown>;

type PreviewRow =
  | { type: "update"; sku: string; name: string; id: string; payload: ProductRequest; fields: string[] }
  | { type: "create"; sku: string; name: string; payload: ProductRequest }
  | { type: "skip";   sku: string; name: string; reason: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

const readText = (row: ImportRow, keys: string[]): string => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
};

const readNum = (row: ImportRow, keys: string[]): number | undefined => {
  const raw = readText(row, keys);
  if (raw === "") return undefined;
  const n = Number(raw.replace(/\$/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resolveCategory = (row: ImportRow, categories: Category[]): string | undefined => {
  const byId = readText(row, ["CategoriaId", "categoryId", "categoriaId"]);
  if (byId && UUID_RE.test(byId)) return byId;
  const byName = readText(row, ["Categoria", "Categoría", "category", "categoria"]).toLowerCase();
  if (!byName) return undefined;
  return categories.find(
    (c) => c.name.toLowerCase() === byName || c.slug.toLowerCase() === byName
  )?.id;
};

function parseExcelRows(
  rows: ImportRow[],
  products: Product[],
  categories: Category[]
): PreviewRow[] {
  return rows.map((row): PreviewRow => {
    const sku = readText(row, ["SKU", "sku"]);
    if (!sku) return { type: "skip", sku: "", name: "", reason: "Fila sin SKU" };

    const name  = readText(row, ["Nombre", "name", "Producto"]);
    const desc  = readText(row, ["Descripcion", "Descripción", "description"]);
    const price = readNum(row, ["Precio", "price"]);
    const stock = readNum(row, ["Stock", "stock", "Inventario"]);
    const image = readText(row, ["Imagen", "imageUrl", "ImagenUrl", "URL Imagen"]);
    const catId = resolveCategory(row, categories);

    const existing = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());

    if (existing) {
      // Merge: Excel values override existing; missing Excel fields keep current DB value
      const mergedName  = name  || existing.name;
      const mergedDesc  = desc  !== "" ? desc : (existing.description ?? "");
      const mergedPrice = price !== undefined ? price : Number(existing.price);
      const mergedStock = stock !== undefined ? Math.max(0, Math.trunc(stock)) : existing.stock;
      const mergedImage = image || existing.imageUrl || undefined;
      const mergedCatId = catId || existing.categoryId || undefined;

      // Detect which fields the Excel actually provides (to show in preview)
      const fields: string[] = [];
      if (name)              fields.push("Nombre");
      if (desc !== "")       fields.push("Descripcion");
      if (price !== undefined) fields.push("Precio");
      if (stock !== undefined) fields.push("Stock");
      if (image)             fields.push("Imagen");
      if (catId)             fields.push("Categoria");

      if (fields.length === 0)
        return { type: "skip", sku, name: existing.name, reason: "Sin campos para actualizar" };

      return {
        type: "update",
        sku,
        name: existing.name,
        id: existing.id,
        fields,
        payload: {
          sku: existing.sku,
          name: mergedName,
          description: mergedDesc,
          price: mergedPrice,
          stock: mergedStock,
          imageUrl: mergedImage,
          categoryId: mergedCatId,
        },
      };
    }

    // New product — name is required
    if (!name)
      return { type: "skip", sku, name: "", reason: "Producto nuevo sin Nombre" };

    return {
      type: "create",
      sku,
      name,
      payload: {
        sku,
        name,
        description: desc || "",
        price: price ?? 0,
        stock: stock !== undefined ? Math.max(0, Math.trunc(stock)) : 0,
        imageUrl: image || undefined,
        categoryId: catId || undefined,
      },
    };
  });
}

// ── Preview Dialog ────────────────────────────────────────────────────────────

function PreviewDialog({
  rows,
  onConfirm,
  onCancel,
  loading,
}: {
  rows: PreviewRow[];
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const updates = rows.filter((r) => r.type === "update");
  const creates = rows.filter((r) => r.type === "create");
  const skips   = rows.filter((r) => r.type === "skip");
  const total   = updates.length + creates.length;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !loading) onCancel(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vista previa de importacion</DialogTitle>
        </DialogHeader>

        {/* Summary badges */}
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
            ✏️ {updates.length} actualizaciones
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            ➕ {creates.length} nuevos
          </Badge>
          {skips.length > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
              ⚠️ {skips.length} omitidos
            </Badge>
          )}
        </div>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay cambios para aplicar. Verifica que el Excel tenga la columna <b>SKU</b> y al menos un campo a actualizar.
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Tipo</th>
                  <th className="text-left py-2 px-3 font-medium">SKU</th>
                  <th className="text-left py-2 px-3 font-medium">Nombre</th>
                  <th className="text-left py-2 px-3 font-medium">Campos</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((r, i) =>
                  r.type === "update" && (
                    <tr key={i} className="border-t hover:bg-muted/30">
                      <td className="py-2 px-3 text-blue-600 font-medium whitespace-nowrap">✏️ Actualizar</td>
                      <td className="py-2 px-3 font-mono text-xs">{r.sku}</td>
                      <td className="py-2 px-3 truncate max-w-[180px]">{r.name}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{r.fields.join(", ")}</td>
                    </tr>
                  )
                )}
                {creates.map((r, i) =>
                  r.type === "create" && (
                    <tr key={`c${i}`} className="border-t hover:bg-muted/30">
                      <td className="py-2 px-3 text-green-600 font-medium whitespace-nowrap">➕ Crear</td>
                      <td className="py-2 px-3 font-mono text-xs">{r.sku}</td>
                      <td className="py-2 px-3 truncate max-w-[180px]">{r.name}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">Producto nuevo</td>
                    </tr>
                  )
                )}
                {skips.map((r, i) =>
                  r.type === "skip" && (
                    <tr key={`s${i}`} className="border-t bg-muted/20">
                      <td className="py-2 px-3 text-yellow-600 whitespace-nowrap">⚠️ Omitir</td>
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{r.sku || "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.name || "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{r.reason}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Column reference */}
        <details className="text-xs text-muted-foreground border rounded-md px-3 py-2">
          <summary className="cursor-pointer select-none hover:text-foreground font-medium">
            Columnas reconocidas en el Excel
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-1 pl-1">
            <span><b>SKU</b> — identificador (requerido)</span>
            <span><b>Nombre</b> — nombre del producto</span>
            <span><b>Descripcion</b> — descripcion</span>
            <span><b>Precio</b> — precio en COP</span>
            <span><b>Stock</b> — unidades disponibles</span>
            <span><b>Categoria</b> — nombre o slug</span>
            <span><b>CategoriaId</b> — UUID de categoria</span>
            <span><b>Imagen</b> — URL de imagen</span>
          </div>
          <p className="mt-2 text-muted-foreground">
            Solo incluye las columnas que quieras actualizar. Los campos no incluidos mantienen su valor actual.
          </p>
        </details>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading || total === 0}>
            {loading
              ? `Importando...`
              : `Confirmar (${total} fila${total !== 1 ? "s" : ""})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function InventoryPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts]         = useState<Record<string, Draft>>({});
  const [q, setQ]                   = useState("");
  const [savingId, setSavingId]     = useState<string | null>(null);
  const [preview, setPreview]       = useState<PreviewRow[] | null>(null);
  const [importing, setImporting]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [productList, categoryList] = await Promise.all([
      productsApi.getAllAdmin(),
      categoriesApi.getAll(),
    ]);
    setProducts(productList);
    setCategories(categoryList);
    setDrafts(
      Object.fromEntries(productList.map((p) => [p.id, { price: Number(p.price), stock: p.stock }]))
    );
  };

  useEffect(() => {
    load().catch(() => toast.error("No se pudo cargar el inventario"));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term)
    );
  }, [products, q]);

  const totals = useMemo(() => {
    const active = products.filter((p) => p.active);
    return {
      active: active.length,
      units:  active.reduce((s, p) => s + p.stock, 0),
      value:  active.reduce((s, p) => s + Number(p.price) * p.stock, 0),
      low:    active.filter((p) => p.stock <= 5).length,
    };
  }, [products]);

  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

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

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
      if (rows.length === 0) {
        toast.error("El archivo no tiene datos");
        return;
      }
      setPreview(parseExcelRows(rows, products, categories));
    } catch {
      toast.error("No se pudo leer el archivo Excel");
    }
  };

  const executeImport = async () => {
    if (!preview) return;
    setImporting(true);
    suppressAuthRedirect(true);
    let created = 0;
    let updated = 0;
    let failed  = 0;

    let firstError = "";

    for (const row of preview) {
      if (row.type === "skip") continue;
      try {
        if (row.type === "update") {
          await productsApi.update(row.id, row.payload);
          updated++;
        } else {
          await productsApi.create(row.payload);
          created++;
        }
      } catch (err: any) {
        failed++;
        const msg = err?.response?.data?.message ?? err?.response?.data ?? err?.message ?? String(err);
        console.error(`[Import] fallo fila ${row.sku}:`, err?.response?.status, msg, err?.response?.data);
        if (!firstError) firstError = `SKU ${row.sku}: ${msg}`;
      }
    }

    suppressAuthRedirect(false);
    setImporting(false);
    setPreview(null);
    await load().catch(() => {});

    if (failed > 0) {
      toast.warning(
        `Importacion con errores: ${created} creados, ${updated} actualizados, ${failed} fallidos` +
        (firstError ? ` — ${firstError}` : "")
      );
    } else {
      toast.success(`Importacion completa: ${created} creados, ${updated} actualizados`);
    }
  };

  return (
    <div className="space-y-5">
      {preview && (
        <PreviewDialog
          rows={preview}
          loading={importing}
          onConfirm={executeImport}
          onCancel={() => { if (!importing) setPreview(null); }}
        />
      )}

      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de stock, costos e importacion masiva de productos.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onFileChange}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="w-4 h-4 mr-1" /> Importar Excel
          </Button>
          <Button variant="outline" onClick={exportXLSX}>
            <Download className="w-4 h-4 mr-1" /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* Summary cards */}
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
          <div className="text-xs text-muted-foreground">Stock bajo (≤5)</div>
          <div className="text-2xl font-bold">{totals.low}</div>
        </Card>
      </div>

      {/* Product table */}
      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por SKU, producto o categoria..."
            className="pl-10"
          />
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
                      <div className="flex items-center gap-3 min-w-48">
                        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0">
                          <ProductImg src={p.imageUrl} alt={p.name} iconSize="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">SKU {p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{p.categoryName ?? "Sin categoria"}</td>
                    <td className="py-3 px-3">
                      <Input
                        type="number"
                        min={0}
                        value={draft.price}
                        className="w-24"
                        onChange={(e) => updateDraft(p.id, { price: Number(e.target.value) })}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        type="number"
                        min={0}
                        value={draft.stock}
                        className="w-20"
                        onChange={(e) => updateDraft(p.id, { stock: Number(e.target.value) })}
                      />
                    </td>
                    <td className="py-3 px-3">
                      {draft.stock <= 0 ? (
                        <Badge variant="destructive">Agotado</Badge>
                      ) : draft.stock <= 5 ? (
                        <Badge variant="secondary">Bajo</Badge>
                      ) : (
                        <Badge variant="outline">Disponible</Badge>
                      )}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => saveProduct(p)}
                        disabled={savingId === p.id}
                      >
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
