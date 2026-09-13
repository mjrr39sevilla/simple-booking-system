import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CalendarCheck, ShieldCheck, Sparkles, Star } from "lucide-react";
import heroImg from "@/assets/hero-clinic.jpg";
import doctorCarmen from "@/assets/doctor-carmen.jpg";
import doctorAndres from "@/assets/doctor-andres.jpg";
import doctorLucia from "@/assets/doctor-lucia.jpg";
import { CLINIC, fetchDoctors, fetchTreatments } from "@/lib/clinic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${CLINIC.name} — Dentista en Madrid con cita online` },
      { name: "description", content: "Reserva tu cita de dentista online en segundos. Ortodoncia, implantes, limpieza y estética dental en el centro de Madrid." },
      { property: "og:title", content: `${CLINIC.name} — Dentista en Madrid con cita online` },
      { property: "og:description", content: "Reserva tu cita de dentista online en segundos. Ortodoncia, implantes, limpieza y estética dental." },
    ],
  }),
  component: HomePage,
});

const DOCTOR_PHOTOS: Record<string, string> = {
  "Dra. Carmen Ruiz": doctorCarmen,
  "Dr. Andrés Molina": doctorAndres,
  "Dra. Lucía Ferrer": doctorLucia,
};

function HomePage() {
  const { data: treatments } = useQuery({ queryKey: ["treatments"], queryFn: fetchTreatments });
  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge variant="secondary" className="mb-4">Primera visita gratuita</Badge>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Tu sonrisa, en las mejores manos
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              En {CLINIC.name} combinamos tecnología de vanguardia con un trato cercano. Reserva tu cita online en menos de un minuto.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/reservar">
                  <CalendarCheck className="size-5" />
                  Reservar cita
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/tratamientos">Ver tratamientos</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />Especialistas certificados</span>
              <span className="flex items-center gap-2"><Sparkles className="size-4 text-primary" />Tecnología digital 3D</span>
              <span className="flex items-center gap-2"><Star className="size-4 text-primary" />4,9/5 en reseñas</span>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Gabinete moderno de la clínica dental"
              className="aspect-[8/5] w-full rounded-3xl object-cover shadow-xl"
              width={1600}
              height={1008}
            />
          </div>
        </div>
      </section>

      {/* Tratamientos destacados */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold">Tratamientos</h2>
              <p className="mt-2 text-muted-foreground">Soluciones para cada necesidad, con precios transparentes.</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/tratamientos">Ver todos <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(treatments ?? []).slice(0, 4).map((t) => (
              <Card key={t.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{t.description}</p>
                  <p className="mt-3 text-sm font-medium text-primary">
                    {t.price_from && t.price_from > 0 ? `Desde ${t.price_from} €` : "Gratuita"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold">Nuestro equipo</h2>
              <p className="mt-2 text-muted-foreground">Profesionales con años de experiencia a tu servicio.</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/equipo">Conócenos <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {(doctors ?? []).map((d) => (
              <Card key={d.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <img
                  src={DOCTOR_PHOTOS[d.full_name]}
                  alt={`Foto de ${d.full_name}`}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                  width={816}
                  height={816}
                />
                <CardContent className="pt-4">
                  <h3 className="font-semibold">{d.full_name}</h3>
                  <p className="text-sm text-primary">{d.specialty}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold">¿Listo para cuidar tu sonrisa?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Elige tratamiento, doctor y hora. Sin llamadas ni esperas.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/reservar"><CalendarCheck className="size-5" />Reservar mi cita</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
