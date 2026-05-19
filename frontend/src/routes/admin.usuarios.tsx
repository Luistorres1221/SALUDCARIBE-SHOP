import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usersApi, type ApiUser, type UserRequest } from "@/api/users";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLE_LABELS, AppRole } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsers,
});

const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];
const EMPTY_FORM: UserRequest = { email: "", password: "", fullName: "", area: "" };

function AdminUsers() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<UserRequest>(EMPTY_FORM);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [saving, setSaving] = useState(false);

  const load = () => usersApi.getAll().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedRoles([]);
    setOpen(true);
  };

  const openEdit = (u: ApiUser) => {
    setEditing(u);
    setForm({ email: u.email, fullName: u.fullName, area: u.area ?? "", password: "" });
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
      const saved = editing
        ? await usersApi.update(editing.id, form)
        : await usersApi.create(form);

      // Sincronizar roles
      const prevRoles: AppRole[] = editing?.roles ?? [];
      const toAdd = selectedRoles.filter((r) => !prevRoles.includes(r));
      const toRemove = prevRoles.filter((r) => !selectedRoles.includes(r));
      await Promise.all([
        ...toAdd.map((r) => usersApi.assignRole(saved.id, r)),
        ...toRemove.map((r) => usersApi.removeRole(saved.id, r)),
      ]);

      toast.success(editing ? "Usuario actualizado" : "Usuario creado");
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al guardar");
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
      <div className="flex justify-between items-center mb-6">
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
                <div className="text-sm text-muted-foreground">{u.email}{u.area && ` · ${u.area}`}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {u.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs gap-1">
                      <Shield className="w-3 h-3" />{ROLE_LABELS[r]}
                    </Badge>
                  ))}
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
              <Label>Área / Cargo</Label>
              <Input
                value={form.area ?? ""}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Ej: Urgencias, Consultorio 3"
              />
            </div>
            <div>
              <Label className="mb-2 block">Roles</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <span className="text-sm">{ROLE_LABELS[role]}</span>
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
