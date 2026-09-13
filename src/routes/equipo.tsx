import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import doctorCarmen from "@/assets/doctor-carmen.jpg";
import doctorAndres from "@/assets/doctor-andres.jpg";
import doctorLucia from "@/assets/doctor-lucia.jpg";
import { CLINIC, fetchDoctors } from "@/lib/clinic";

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: `Nuestro equipo — ${CLINIC.name}` },
      { name: "description", content: "Conoce a los doctores de nuestra clínica dental: especialistas en odontología general, implantología y ortodoncia." },
      { property: "og:title", content: `Nuestro equipo — ${CLINIC.name}` },
      { property: "og:description", content: "Especialistas en odontología general, implantología y ortodoncia." },
    ],
  }),
  component: TeamPage,
});

const DOCTOR_PHOTOS: Record<string, string> = {
  "Dra. Carmen Ruiz": doctorCarmen,
  "Dr. Andrés Molina": doctorAndres,
  "Dra. Lucía Ferrer": doctorLucia,
};

function TeamPage() {
  const { data: doctors, isLoading } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Nuestro equipo</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Un equipo de especialistas en formación continua para ofrecerte el mejor cuidado dental.
      </p>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Cargando equipo…</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <CardContent className="pt-5">
                <h2 className="text-lg font-semibold">{d.full_name}</h2>
                <p className="text-sm font-medium text-primary">{d.specialty}</p>
                <p className="mt-2 text-sm text-muted-foreground">{d.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
