import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { productsApi, type Product, type ProductRequest } from "@/api/products";
import { categoriesApi, type Category } from "@/api/categories";
import { apiClient } from "@/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, Download, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/lib/cart-context";
import { resolveImageUrl } from "@/lib/utils";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/productos")({
  component: AdminProducts,
});

const EMPTY: ProductRequest = { sku: "", name: "", description: "", price: 0, stock: 0, categoryId: "", imageUrl: "" };

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductRequest>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => productsApi.getAllAdmin().then(setProducts).catch(() => {});

  useEffect(() => {
    load();
    categoriesApi.getAll().then(setCats).catch(() => {});
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, categoryId: cats[0]?.id ?? "" });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, description: p.description ?? "",
      price: Number(p.price), stock: p.stock,
      categoryId: p.categoryId ?? "", imageUrl: p.imageUrl ?? "",
    });
    setOpen(true);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post<{ url: string }>("/api/uploads", fd);
      const baseUrl = apiClient.defaults.baseURL ?? "";
      const imageUrl = res.data.url.startsWith("http")
        ? res.data.url
        : `${baseUrl}${res.data.url}`;
      setForm((prev) => ({ ...prev, imageUrl }));
      toast.success("Imagen subida correctamente");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Error desconocido";
      toast.error(`No se pudo subir la imagen: ${msg}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    try {
      if (editing) await productsApi.update(editing.id, form);
      else await productsApi.create(form);
      toast.success("Guardado");
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al guardar");
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`¿Desactivar "${p.name}"?`)) return;
    try {
      await productsApi.delete(p.id);
      toast.success("Producto desactivado");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const exportXLSX = () => {
    const rows = products.map((p) => ({
      SKU: p.sku, Nombre: p.name, Categoría: p.categoryName,
      Precio: Number(p.price), Stock: p.stock, Activo: p.active,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "productos.xlsx");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportXLSX}>
            <Download className="w-4 h-4 mr-1" /> Exportar
          </Button>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo</Button>
        </div>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <Card key={p.id} className="p-4 flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {p.imageUrl
                ? <img src={resolveImageUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-cover" />
                : <Package className="w-6 h-6 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">SKU: {p.sku} · {p.categoryName}</div>
              <div className="text-sm font-bold">{formatCOP(Number(p.price))}</div>
            </div>
            <Badge variant={p.stock === 0 ? "destructive" : "secondary"}>Stock: {p.stock}</Badge>
            {!p.active && <Badge variant="outline">Inactivo</Badge>}
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nuevo"} producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoryId ?? ""} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Precio (COP)</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
            </div>

            {/* ── Imagen ─────────────────────────────────────────── */}
            <div>
              <Label>Imagen del producto</Label>

              {/* Vista previa */}
              {form.imageUrl ? (
                <div className="relative mt-1 mb-2 w-full h-40 rounded-md overflow-hidden border border-border bg-muted">
                  <img src={resolveImageUrl(form.imageUrl)} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-1 mb-2 w-full h-40 rounded-md border border-dashed border-border bg-muted flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Package className="w-8 h-8 opacity-40" />
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}

              {/* Botón subir archivo */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mb-2"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Subiendo..." : "Seleccionar imagen desde equipo"}
              </Button>

              {/* O pegar URL */}
              <Input
                value={form.imageUrl ?? ""}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="O pega una URL de imagen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={uploading}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
