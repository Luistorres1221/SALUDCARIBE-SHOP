import { useAuth } from "@/lib/auth-context";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function InactivityGuard() {
  const { user, signOut } = useAuth();
  const { showWarning, extendSession } = useInactivityTimeout(!!user, signOut);

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Sigues ahí?</AlertDialogTitle>
          <AlertDialogDescription>
            Tu sesión se cerrará automáticamente en <strong>30 segundos</strong> por
            inactividad. ¿Deseas continuar trabajando?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={signOut}>
            Cerrar sesión
          </AlertDialogCancel>
          <AlertDialogAction onClick={extendSession}>
            Continuar trabajando
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
