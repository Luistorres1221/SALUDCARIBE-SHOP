import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { warehousesApi, type Warehouse, type WarehouseRequest, type WarehouseType } from "@/api/warehouses";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Edit, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bodegas")({
  component: AdminBodegas,
});

const TYPE_LABELS: Record<WarehouseType, string> = {
  PRINCIPAL: "Almacén Principal",
  SUBBODEGA: "Subbodega",
};

const EMPTY_FORM: WarehouseRequest = {
  code: "", name: "", location: "", description: "", type: "SUBBODEGA", active: true,
};

function AdminBodegas() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [open, setOpen]             = useState(false);
  const [editing, setEditing]       = useState<Warehouse | null>(null);
  const [form, setForm]             = useState<WarehouseRequest>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const load = () => warehousesApi.getAll().then(setWarehouses).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setOpen(true); };
  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({ code: w.code, name: w.name, location: w.location, description: w.description, type: w.type, active: w.active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) { toast.error("Ingrese un código"); return; }
    if (!form.name.trim()) { toast.error("Ingrese el nombre"); return; }
    if (!form.location.trim()) { toast.error("Ingrese la ubicación"); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await warehousesApi.update(editing.id, form);
        setWarehouses((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        toast.success("Bodega actualizada");
      } else {
        const created = await warehousesApi.create(form);
        setWarehouses((p) => [...p, created]);
        toast.success("Bodega creada");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const principals = warehouses.filter((w) => w.type === "PRINCIPAL");
  const subs       = warehouses.filter((w) => w.type === "SUBBODEGA");

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6" /> Gestión de Bodegas
        </h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nueva bodega
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total bodegas" value={warehouses.length} />
        <StatCard label="Almacenes Principales" value={principals.length} />
        <StatCard label="Subbodegas" value={subs.length} />
      </div>

      {/* Table */}
      {warehouses.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No hay bodegas registradas.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 font-semibold">Código</th>
                  <th className="text-left p-3 font-semibold">Nombre</th>
                  <th className="text-left p-3 font-semibold">Ubicación</th>
                  <th className="text-left p-3 font-semibold">Tipo</th>
                  <th className="text-center p-3 font-semibold">Estado</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs font-semibold">{w.code}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{w.name}</span>
                      </div>
                      {w.description && <div className="text-xs text-muted-foreground mt-0.5">{w.description}</div>}
                    </td>
                    <td className="p-3 text-muted-foreground">{w.location}</td>
                    <td className="p-3">
                      <Badge variant={w.type === "PRINCIPAL" ? "default" : "secondary"}>
                        {TYPE_LABELS[w.type]}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={w.active ? "outline" : "destructive"}>
                        {w.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(w)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar bodega" : "Nueva bodega"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ej: BOD-CTG"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as WarehouseType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRINCIPAL">Almacén Principal</SelectItem>
                    <SelectItem value="SUBBODEGA">Subbodega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Ubicación <span className="text-destructive">*</span></Label>
              <Input placeholder="Ej: Cartagena" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {editing && (
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={form.active ? "true" : "false"} onValueChange={(v) => setForm({ ...form, active: v === "true" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa</SelectItem>
                    <SelectItem value="false">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}
