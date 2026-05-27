import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dependenciesApi, type Dependency, type DependencyRequest } from "@/api/dependencies";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Layers, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/dependencias")({
  component: AdminDependencies,
});

const EMPTY: DependencyRequest = { code: "", name: "", active: true };

function AdminDependencies() {
  const [items, setItems] = useState<Dependency[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dependency | null>(null);
  const [form, setForm] = useState<DependencyRequest>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => dependenciesApi.listAll().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEdit = (item: Dependency) => {
    setEditing(item);
    setForm({ code: item.code, name: item.name, active: item.active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Código y nombre son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const saved = editing
        ? await dependenciesApi.update(editing.id, form)
        : await dependenciesApi.create(form);
      setItems((prev) =>
        editing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]
      );
      toast.success(editing ? "Dependencia actualizada" : "Dependencia creada");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Desactivar esta dependencia?")) return;
    try {
      await dependenciesApi.remove(id);
      toast.success("Dependencia desactivada");
      load();
    } catch {
      toast.error("No se pudo desactivar");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6" /> Dependencias
        </h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay dependencias registradas.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{item.code}</span>
                  <Badge variant={item.active ? "default" : "secondary"}>
                    {item.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div className="text-sm mt-0.5 truncate">{item.name}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(item.id)}
                  disabled={!item.active}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar" : "Nueva"} dependencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ej: DEP-001"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ej: Urgencias"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="dep-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label htmlFor="dep-active">Activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
