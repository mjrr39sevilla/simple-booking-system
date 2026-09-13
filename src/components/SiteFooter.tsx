import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone, Smile } from "lucide-react";
import { CLINIC } from "@/lib/clinic";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Smile className="size-5" />
            </span>
            {CLINIC.name}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Cuidamos de tu sonrisa con un trato cercano y la última tecnología dental.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Contacto</p>
          <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4 shrink-0" />{CLINIC.address}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4 shrink-0" />{CLINIC.phone}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4 shrink-0" />{CLINIC.email}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4 shrink-0" />{CLINIC.hours}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Enlaces</p>
          <nav className="flex flex-col gap-1" aria-label="Pie de página">
            <Link to="/tratamientos" className="text-muted-foreground hover:text-foreground">Tratamientos</Link>
            <Link to="/equipo" className="text-muted-foreground hover:text-foreground">Equipo</Link>
            <Link to="/reservar" className="text-muted-foreground hover:text-foreground">Reservar cita</Link>
            <Link to="/contacto" className="text-muted-foreground hover:text-foreground">Contacto</Link>
          </nav>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {CLINIC.name}. Datos de ejemplo para demostración.
      </div>
    </footer>
  );
}
