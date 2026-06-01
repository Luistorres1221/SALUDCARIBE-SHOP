import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cargosApi, type Cargo, type CargoRequest } from "@/api/cargos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BriefcaseBusiness, Edit, Plus, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cargos")({
  component: AdminCargos,
});

const EMPTY: CargoRequest = { name: "", description: "" };

function AdminCargos() {
  const [cargos, setCargos]     = useState<Cargo[]>([]);
  const [q, setQ]               = useState("");
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Cargo | null>(null);
  const [form, setForm]         = useState<CargoRequest>(EMPTY);
  const [saving, setSaving]     = useState(false);

  const load = () => cargosApi.getAll().then(setCargos).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = cargos.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (c: Cargo) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "", active: c.active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      if (editing) {
        await cargosApi.update(editing.id, form);
        toast.success("Cargo actualizado");
      } else {
        await cargosApi.create(form);
        toast.success("Cargo creado");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Cargo) => {
    try {
      await cargosApi.toggleActive(c.id);
      toast.success(c.active ? "Cargo desactivado" : "Cargo activado");
      load();
    } catch {
      toast.error("No se pudo cambiar el estado");
    }
  };

  const remove = async (c: Cargo) => {
    if (!confirm(`¿Eliminar el cargo "${c.name}"?`)) return;
    try {
      await cargosApi.delete(c.id);
      toast.success("Cargo eliminado");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BriefcaseBusiness className="w-6 h-6" /> Cargos
        </h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo cargo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cargo..."
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {cargos.length === 0 ? "No hay cargos registrados." : "Sin resultados."}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant={c.active ? "default" : "secondary"} className="text-xs">
                    {c.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {c.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  title={c.active ? "Desactivar" : "Activar"}
                  onClick={() => toggle(c)}
                >
                  {c.active
                    ? <ToggleRight className="w-4 h-4 text-green-600" />
                    : <ToggleLeft  className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!o && !saving) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cargo" : "Nuevo cargo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre del cargo <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Médico"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción del cargo (opcional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
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
