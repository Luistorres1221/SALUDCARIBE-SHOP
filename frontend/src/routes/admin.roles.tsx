import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usersApi, type ApiUser } from "@/api/users";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AppRole, ROLE_LABELS } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/roles")({
  component: AdminRoles,
});

const ROLE_KEYS: AppRole[] = [
  "admin", "medico", "odontologia", "enfermeria", "administrativo", "aseo", "papeleria",
];

function AdminRoles() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("administrativo");

  const load = () => usersApi.getAll().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      await usersApi.assignRole(userId, role);
      toast.success("Rol asignado");
      setAdding(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al asignar rol");
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    try {
      await usersApi.removeRole(userId, role);
      toast.success("Rol removido");
      load();
    } catch {
      toast.error("Error al remover rol");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Roles de usuarios</h1>
        <p className="text-sm text-muted-foreground">Asigna o revoca roles del sistema a los usuarios.</p>
      </div>

      <div className="grid gap-3">
        {users.map((u) => (
          <Card key={u.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{u.fullName}</div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {u.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="gap-1">
                      <Shield className="w-3 h-3" />
                      {ROLE_LABELS[r]}
                      <button onClick={() => removeRole(u.id, r)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {u.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sin roles</span>
                  )}
                </div>
              </div>
              <div>
                {adding === u.id ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                      <SelectTrigger className="w-40 sm:w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_KEYS.filter((k) => !u.roles.includes(k)).map((k) => (
                          <SelectItem key={k} value={k}>{ROLE_LABELS[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => assignRole(u.id, newRole)}>Asignar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setAdding(u.id); setNewRole("administrativo"); }}>
                    <Plus className="w-3 h-3 mr-1" /> Rol
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
