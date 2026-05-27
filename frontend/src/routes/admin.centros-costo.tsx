import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { costCentersApi, type CostCenter, type CostCenterRequest } from "@/api/costCenters";
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
import { Building2, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/centros-costo")({
  component: AdminCostCenters,
});

const EMPTY: CostCenterRequest = { code: "", name: "", budget: null, active: true };

function AdminCostCenters() {
  const [items, setItems] = useState<CostCenter[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<CostCenterRequest>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => costCentersApi.listAll().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEdit = (item: CostCenter) => {
    setEditing(item);
    setForm({ code: item.code, name: item.name, budget: item.budget, active: item.active });
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
        ? await costCentersApi.update(editing.id, form)
        : await costCentersApi.create(form);
      setItems((prev) =>
        editing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]
      );
      toast.success(editing ? "Centro de costo actualizado" : "Centro de costo creado");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Desactivar este centro de costo?")) return;
    try {
      await costCentersApi.remove(id);
      toast.success("Centro de costo desactivado");
      load();
    } catch {
      toast.error("No se pudo desactivar");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6" /> Centros de Costo
        </h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay centros de costo registrados.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{item.code}</span>
                  <Badge variant={item.active ? "default" : "secondary"}>
                    {item.active ? "Activo" : "Inactivo"}
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
              {editing ? "Editar" : "Nuevo"} centro de costo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ej: CC-001"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ej: Administración General"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Presupuesto anual (COP) <span className="text-muted-foreground text-xs">opcional</span></Label>
              <Input
                type="number"
                placeholder="Ej: 50000000"
                min={0}
                value={form.budget ?? ""}
                onChange={(e) =>
                  setForm({ ...form, budget: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="cc-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label htmlFor="cc-active">Activo</Label>
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
