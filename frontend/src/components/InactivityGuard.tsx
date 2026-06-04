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
  const { showWarning, countdown, extendSession } = useInactivityTimeout(!!user, signOut);

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Sigues ahí?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>Tu sesión se cerrará automáticamente por inactividad.</p>
              <p className="mt-3 text-center">
                <span className="text-5xl font-bold tabular-nums text-foreground">
                  {countdown}
                </span>
                <span className="block text-sm text-muted-foreground">segundos restantes</span>
              </p>
            </div>
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
