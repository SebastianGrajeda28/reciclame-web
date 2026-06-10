import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/shared/context/UserContext";

/**
 * Mensaje de acceso denegado para usuarios que intentan entrar a
 * pantallas fuera de su rol (p. ej. un admin en zonas de sysadmin).
 * Ofrece una salida a una página válida según el estado de la sesión.
 */
export default function AccessDenied() {
  const { account } = useUser();
  const hasSession = Boolean(account);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <ShieldAlert className="w-12 h-12 text-(--brand) mx-auto mb-2" />
          <CardTitle className="text-2xl">Acceso denegado</CardTitle>
          <CardDescription>
            No tienes permisos para ver esta página. Si crees que se trata de
            un error, contacta con un administrador del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to={hasSession ? "/" : "/login"}>
              {hasSession ? "Volver al inicio" : "Ir a iniciar sesión"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
