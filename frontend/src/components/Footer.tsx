import { useRouterState } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";
import { Phone, Mail, MapPin, Globe } from "lucide-react";

export function Footer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/auth") return null;

  return (
    <footer className="gradient-brand border-t border-white/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">

          {/* Logo y marca */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="SaludCaribe Shop"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white/40 shadow-md"
              />
              <div>
                <p className="font-bold text-lg text-brand-foreground leading-tight">SaludCaribe</p>
                <p className="text-sm text-brand-foreground/80 font-medium">Shop</p>
              </div>
            </div>
            <a
              href="https://www.saluddelcaribe.com/site/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-foreground/80 hover:text-brand-foreground transition-colors"
            >
              <Globe className="w-4 h-4 shrink-0" />
              www.saluddelcaribe.com
            </a>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-brand-foreground mb-3">Central de Citas</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-brand-foreground/80">
                <Phone className="w-4 h-4 shrink-0" />
                <span>Cartagena: <a href="tel:+576056932177" className="hover:text-brand-foreground transition-colors">+57 605 6932177</a></span>
              </li>
              <li className="flex items-center gap-2 text-sm text-brand-foreground/80">
                <Phone className="w-4 h-4 shrink-0" />
                <span>Armenia: <a href="tel:+576067314460" className="hover:text-brand-foreground transition-colors">+57 606 7314460</a></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-brand-foreground/80">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <a
                  href="mailto:centraldecitas@saluddelcaribe.com"
                  className="hover:text-brand-foreground transition-colors break-all"
                >
                  centraldecitas@saluddelcaribe.com
                </a>
              </li>
            </ul>
          </div>

          {/* Sedes */}
          <div>
            <h3 className="font-semibold text-brand-foreground mb-3">Nuestras Sedes</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-brand-foreground/80">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-brand-foreground">Sede Norte</p>
                  <p>Calle 2 Norte #12-78, Barrio Alcázar</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm text-brand-foreground/80">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-brand-foreground">Sede Sur</p>
                  <p>Cra 19 #50-25, Sector Tres Esquinas</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Línea inferior */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center text-xs text-brand-foreground/60">
          © {new Date().getFullYear()} Salud del Caribe. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
