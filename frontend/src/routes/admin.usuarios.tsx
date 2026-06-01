import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usersApi, type ApiUser, type UserRequest } from "@/api/users";
import { cargosApi, type Cargo } from "@/api/cargos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppRole } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BriefcaseBusiness, Plus, Edit, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsers,
});

// Solo los 3 roles principales del sistema
const MAIN_ROLES: { key: AppRole; label: string; description: string }[] = [
  { key: "admin",       label: "Administrador", description: "Acceso completo al sistema" },
  { key: "almacenista", label: "Almacenista",   description: "Gestión de inventario y despacho" },
  { key: "empleado",    label: "Empleado",       description: "Crear y consultar pedidos" },
];

const EMPTY_FORM: UserRequest = { email: "", password: "", fullName: "", area: "", cargoId: undefined };

function AdminUsers() {
  const [users, setUsers]         = useState<ApiUser[]>([]);
  const [cargos, setCargos]       = useState<Cargo[]>([]);
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState<ApiUser | null>(null);
  const [form, setForm]           = useState<UserRequest>(EMPTY_FORM);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [saving, setSaving]       = useState(false);

  const load = () => usersApi.getAll().then(setUsers).catch(() => {});
  useEffect(() => {
    load();
    cargosApi.getActive().then(setCargos).catch(() => {});
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedRoles([]);
    setOpen(true);
  };

  const openEdit = (u: ApiUser) => {
    setEditing(u);
    setForm({ email: u.email, fullName: u.fullName, area: u.area ?? "", password: "", cargoId: u.cargoId ?? undefined });
    setSelectedRoles([...u.roles]);
    setOpen(true);
  };

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const save = async () => {
    if (!form.fullName || !form.email) {
      toast.error("Nombre y email son obligatorios");
      return;
    }
    if (!editing && !form.password) {
      toast.error("La contraseña es obligatoria para nuevos usuarios");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, roles: selectedRoles };
      if (editing) {
        await usersApi.update(editing.id, payload);
      } else {
        await usersApi.create(payload);
      }
      toast.success(editing ? "Usuario actualizado" : "Usuario creado");
      setOpen(false);
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors.map((e: any) => e.defaultMessage).join(", ") : null) ||
        `Error HTTP ${err?.response?.status ?? "desconocido"}`;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: ApiUser) => {
    if (!confirm(`¿Eliminar al usuario ${u.email}?`)) return;
    try {
      await usersApi.delete(u.id);
      toast.success("Usuario eliminado");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo usuario</Button>
      </div>

      {users.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No hay usuarios. Crea el primero con el botón de arriba.
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{u.fullName}</div>
                <div className="text-sm text-muted-foreground">
                  {u.email}
                  {u.area && ` · ${u.area}`}
                  {u.cargoName && (
                    <span className="inline-flex items-center gap-1 ml-1">
                      · <BriefcaseBusiness className="w-3 h-3 inline" /> {u.cargoName}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {u.roles.map((r) => {
                    const main = MAIN_ROLES.find((m) => m.key === r);
                    return (
                      <Badge key={r} variant="secondary" className="text-xs gap-1">
                        <Shield className="w-3 h-3" />
                        {main?.label ?? r}
                      </Badge>
                    );
                  })}
                  {u.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Sin roles asignados</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(u)}>
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
            <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Ej: María Torres"
              />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@saludcaribe.com"
              />
            </div>
            <div>
              <Label>
                {editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              </Label>
              <Input
                type="password"
                value={form.password ?? ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <Label>Área</Label>
              <Input
                value={form.area ?? ""}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Ej: Urgencias, Consultorio 3"
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Select
                value={form.cargoId ?? "none"}
                onValueChange={(v) => setForm({ ...form, cargoId: v === "none" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cargo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cargo asignado</SelectItem>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Rol del sistema</Label>
              <div className="space-y-2">
                {MAIN_ROLES.map(({ key, label, description }) => (
                  <label
                    key={key}
                    className="flex items-start gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(key)}
                      onCheckedChange={() => toggleRole(key)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                        {label}
                      </div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                  </label>
                ))}
              </div>
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
