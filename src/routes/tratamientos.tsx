import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { CLINIC, fetchTreatments } from "@/lib/clinic";

export const Route = createFileRoute("/tratamientos")({
  head: () => ({
    meta: [
      { title: `Tratamientos — ${CLINIC.name}` },
      { name: "description", content: "Ortodoncia, implantes, limpieza, estética dental, endodoncia y urgencias. Conoce nuestros tratamientos y precios orientativos." },
      { property: "og:title", content: `Tratamientos — ${CLINIC.name}` },
      { property: "og:description", content: "Ortodoncia, implantes, limpieza, estética dental, endodoncia y urgencias." },
    ],
  }),
  component: TreatmentsPage,
});

function TreatmentsPage() {
  const { data: treatments, isLoading } = useQuery({ queryKey: ["treatments"], queryFn: fetchTreatments });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Tratamientos</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Ofrecemos un catálogo completo de tratamientos con precios orientativos y transparentes. El presupuesto final se confirma siempre tras la primera visita.
      </p>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Cargando tratamientos…</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(treatments ?? []).map((t) => (
            <Card key={t.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{t.name}</h2>
                  <Badge variant={t.price_from && t.price_from > 0 ? "secondary" : "default"}>
                    {t.price_from && t.price_from > 0 ? `Desde ${t.price_from} €` : "Gratuita"}
                  </Badge>
                </div>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{t.description}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> Duración aproximada: {t.duration_minutes} min
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/reservar">Reservar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
