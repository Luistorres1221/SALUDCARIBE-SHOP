import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, pwd);
      toast.success("Bienvenido");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-brand flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-5 sm:p-8 shadow-card">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <img src={logoImg} alt="SaludCaribe Shop" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mb-3 shadow-md" />
          <h1 className="text-2xl font-bold">SaludCaribe Shop</h1>
          <p className="text-sm text-muted-foreground">Gestión interna de insumos médicos</p>
        </div>

        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@saludcaribe.com"
            />
          </div>
          <div>
            <Label htmlFor="pwd">Contraseña</Label>
            <Input
              id="pwd"
              type="password"
              required
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
          <p className="text-xs text-muted-foreground text-center pt-2">
            ¿No tienes cuenta? Contacta al administrador del sistema.
          </p>
        </form>
      </Card>
    </div>
  );
}
