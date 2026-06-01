import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usersApi, type ApiUser } from "@/api/users";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, X, Users, Package } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/roles")({
  component: AdminRoles,
});

// ── Los 3 roles principales del sistema ──────────────────────────────────────

const ROLES: {
  key: AppRole;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  permisos: string[];
}[] = [
  {
    key:         "admin",
    label:       "Administrador",
    description: "Acceso completo al sistema.",
    icon:        Shield,
    color:       "text-primary bg-primary/10",
    permisos: [
      "Gestión completa de usuarios, roles y cargos",
      "Gestión completa de bodegas e inventario",
      "Gestión completa de productos y categorías",
      "Gestión completa de pedidos y reportes",
      "Configuración general del sistema",
    ],
  },
  {
    key:         "almacenista",
    label:       "Almacenista",
    description: "Encargado de preparar, despachar y entregar productos.",
    icon:        Package,
    color:       "text-amber-600 bg-amber-50",
    permisos: [
      "Dashboard (solo visualización)",
      "Stock Bodegas — consultar disponibilidad",
      "Traslados — confirmar recepciones y consultar historial",
      "Kardex — consultar movimientos de inventario",
      "Pedidos — preparar, entregar y registrar entregas",
      "Lotes/Vencimientos — consultar y seleccionar lotes al despachar",
    ],
  },
  {
    key:         "empleado",
    label:       "Empleado",
    description: "Usuario que realiza solicitudes de insumos.",
    icon:        Users,
    color:       "text-green-600 bg-green-50",
    permisos: [
      "Crear pedidos de insumos",
      "Consultar estado e historial de sus pedidos",
      "Gestionar su perfil de usuario",
    ],
  },
];

function AdminRoles() {
  const [users, setUsers]   = useState<ApiUser[]>([]);
  const [adding, setAdding] = useState<{ userId: string; role: AppRole } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => usersApi.getAll().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const assign = async (userId: string, role: AppRole) => {
    setSaving(true);
    try {
      await usersApi.assignRole(userId, role);
      toast.success("Rol asignado correctamente");
      setAdding(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Error al asignar rol");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (userId: string, role: AppRole) => {
    try {
      await usersApi.removeRole(userId, role);
      toast.success("Rol removido");
      load();
    } catch {
      toast.error("Error al remover rol");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" /> Roles del sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          El sistema maneja tres roles principales. Asigna el rol correcto a cada usuario según sus responsabilidades.
        </p>
      </div>

      {/* ── Descripción de roles ────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {ROLES.map((r) => (
          <Card key={r.key} className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.color}`}>
                <r.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.description}</div>
              </div>
            </div>
            <ul className="space-y-1">
              {r.permisos.map((p) => (
                <li key={p} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-green-500 shrink-0">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* ── Asignación por usuario ──────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-3">Asignación de roles por usuario</h2>
        <div className="space-y-2">
          {users.map((u) => {
            const mainRoles = u.roles.filter((r) => ROLES.some((x) => x.key === r));
            const availableToAdd = ROLES.filter((r) => !u.roles.includes(r.key));
            return (
              <Card key={u.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.fullName}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mainRoles.map((r) => {
                        const cfg = ROLES.find((x) => x.key === r);
                        return (
                          <Badge key={r} variant="secondary" className="gap-1 text-xs">
                            {cfg && <cfg.icon className="w-3 h-3" />}
                            {cfg?.label ?? r}
                            <button
                              onClick={() => remove(u.id, r)}
                              className="ml-0.5 hover:text-destructive"
                              title="Quitar rol"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                      {mainRoles.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">Sin rol asignado</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {adding?.userId === u.id ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {availableToAdd.map((r) => (
                          <Button
                            key={r.key}
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            onClick={() => assign(u.id, r.key)}
                            className="text-xs h-7"
                          >
                            <r.icon className="w-3 h-3 mr-1" />
                            {r.label}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => setAdding(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : availableToAdd.length > 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setAdding({ userId: u.id, role: availableToAdd[0].key })}
                      >
                        <Shield className="w-3 h-3 mr-1" /> Asignar rol
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Todos los roles asignados</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
