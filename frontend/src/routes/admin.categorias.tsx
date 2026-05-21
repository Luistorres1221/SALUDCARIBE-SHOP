import { createFileRoute } from "@tanstack/react-router";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { apiClient } from "@/api/client";
import { categoriesApi, type Category, type CategoryRequest } from "@/api/categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, ImageIcon, Plus, Trash2, Upload, X } from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategories,
});

const EMPTY_FORM: CategoryRequest = {
  name: "",
  slug: "",
  description: "",
  icon: "Package",
  imageUrl: "",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryRequest>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => categoriesApi.getAll().then(setCats).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      icon: category.icon ?? "Package",
      imageUrl: category.imageUrl ?? "",
    });
    setOpen(true);
  };

  const handleImageFile = async (e: ChangeEvent<HTMLInputElement>) => {
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
    const payload: CategoryRequest = { ...form, slug: form.slug || slugify(form.name) };
    try {
      const saved = editing
        ? await categoriesApi.update(editing.id, payload)
        : await categoriesApi.create(payload);
      if (payload.imageUrl && !saved.imageUrl) {
        toast.error("La categoria se guardo, pero el backend no devolvio la imagen. Reinicia el backend.");
        return;
      }
      setCats((prev) => {
        if (editing) return prev.map((cat) => (cat.id === saved.id ? saved : cat));
        return [...prev, saved];
      });
      toast.success("Guardado");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al guardar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminar categoria?")) return;
    try {
      await categoriesApi.delete(id);
      toast.success("Eliminada");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {cats.map((c) => (
          <Card key={c.id} className="p-4 flex items-center justify-between gap-3">
            <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
              {c.imageUrl ? (
                <img src={resolveImageUrl(c.imageUrl)} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-7 h-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground truncate">/{c.slug} - {c.description}</div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nueva"} categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input placeholder="auto" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Icono (lucide)</Label>
              <Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div>
              <Label>Imagen de la categoria</Label>
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
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
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
