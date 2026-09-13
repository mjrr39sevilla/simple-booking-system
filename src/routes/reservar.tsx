import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Clock, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  CLINIC,
  fetchDoctors,
  fetchSlots,
  fetchTreatments,
  formatSlot,
  type Doctor,
  type Treatment,
} from "@/lib/clinic";

export const Route = createFileRoute("/reservar")({
  head: () => ({
    meta: [
      { title: `Reservar cita — ${CLINIC.name}` },
      { name: "description", content: "Reserva tu cita de dentista online: elige tratamiento, doctor y hora disponible en nuestra agenda." },
      { property: "og:title", content: `Reservar cita — ${CLINIC.name}` },
      { property: "og:description", content: "Elige tratamiento, doctor y hora disponible en nuestra agenda." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: treatments, isLoading: loadingTreatments } = useQuery({
    queryKey: ["treatments"],
    queryFn: fetchTreatments,
  });
  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  const dateStr = date ? format(date, "yyyy-MM-dd") : null;
  const { data: slots, isFetching: loadingSlots } = useQuery({
    queryKey: ["slots", doctor?.id, dateStr, treatment?.duration_minutes],
    queryFn: () => fetchSlots(doctor!.id, dateStr!, treatment!.duration_minutes),
    enabled: !!doctor && !!dateStr && !!treatment && !!session,
  });

  const steps = ["Tratamiento", "Doctor", "Fecha y hora", "Confirmar"];

  async function confirmBooking() {
    if (!session || !treatment || !doctor || !slot) return;
    setSubmitting(true);
    const startsAt = new Date(slot);
    const endsAt = new Date(startsAt.getTime() + treatment.duration_minutes * 60000);
    const { error } = await supabase.from("appointments").insert({
      patient_id: session.user.id,
      doctor_id: doctor.id,
      treatment_id: treatment.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo reservar", {
        description: "Ese hueco puede haberse ocupado. Elige otro horario.",
      });
      return;
    }
    toast.success("¡Cita reservada!", {
      description: "La clínica confirmará tu cita en breve.",
    });
    navigate({ to: "/mis-citas" });
  }

  const summary = useMemo(
    () =>
      treatment && doctor && slot
        ? { treatment, doctor, slot }
        : null,
    [treatment, doctor, slot]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Reservar cita</h1>

      {/* Stepper */}
      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Pasos de la reserva">
        {steps.map((label, i) => (
          <li key={label}>
            <Badge variant={step === i + 1 ? "default" : step > i + 1 ? "secondary" : "outline"}>
              {step > i + 1 ? <Check className="size-3" /> : null}
              {i + 1}. {label}
            </Badge>
          </li>
        ))}
      </ol>

      {!session && !authLoading && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <LogIn className="size-10 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Necesitas una cuenta para reservar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Entra o crea tu cuenta gratuita en un minuto y continúa con tu reserva.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth" search={{ redirect: "/reservar" }}>Entrar o crear cuenta</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {session && (
        <div className="mt-8">
          {step === 1 && (
            <section aria-label="Elegir tratamiento">
              <h2 className="text-lg font-semibold">Elige un tratamiento</h2>
              {loadingTreatments ? (
                <p className="mt-4 text-muted-foreground">Cargando…</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(treatments ?? []).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTreatment(t); setStep(2); }}
                      className={cn(
                        "rounded-xl border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-sm",
                        treatment?.id === t.id && "border-primary ring-1 ring-primary"
                      )}
                    >
                      <p className="font-medium">{t.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />{t.duration_minutes} min
                        {t.price_from ? ` · desde ${t.price_from} €` : " · gratuita"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section aria-label="Elegir doctor">
              <h2 className="text-lg font-semibold">Elige un profesional</h2>
              {loadingDoctors ? (
                <p className="mt-4 text-muted-foreground">Cargando…</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {(doctors ?? []).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setDoctor(d); setStep(3); }}
                      className={cn(
                        "rounded-xl border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-sm",
                        doctor?.id === d.id && "border-primary ring-1 ring-primary"
                      )}
                    >
                      <p className="font-medium">{d.full_name}</p>
                      <p className="text-sm text-primary">{d.specialty}</p>
                    </button>
                  ))}
                </div>
              )}
              <StepBack onClick={() => setStep(1)} />
            </section>
          )}

          {step === 3 && (
            <section aria-label="Elegir fecha y hora">
              <h2 className="text-lg font-semibold">Elige fecha y hora</h2>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <Card>
                  <CardContent className="flex justify-center pt-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => { setDate(d); setSlot(null); }}
                      locale={es}
                      disabled={(d) =>
                        isBefore(startOfDay(d), startOfDay(new Date())) ||
                        isBefore(addDays(new Date(), 60), d)
                      }
                      className="pointer-events-auto p-3"
                    />
                  </CardContent>
                </Card>
                <div>
                  {date ? (
                    loadingSlots ? (
                      <p className="text-muted-foreground">Buscando huecos libres…</p>
                    ) : slots && slots.length > 0 ? (
                      <>
                        <p className="text-sm font-medium capitalize">
                          {format(date, "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {slots.map((s) => (
                            <Button
                              key={s}
                              variant={slot === s ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSlot(s)}
                            >
                              {formatSlot(s)}
                            </Button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        No hay huecos libres este día. Prueba con otra fecha.
                      </p>
                    )
                  ) : (
                    <p className="text-muted-foreground">Selecciona un día en el calendario.</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <StepBack onClick={() => setStep(2)} />
                <Button disabled={!slot} onClick={() => setStep(4)}>
                  Continuar <ArrowRight className="size-4" />
                </Button>
              </div>
            </section>
          )}

          {step === 4 && summary && (
            <section aria-label="Confirmar reserva">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="size-5 text-primary" />
                    Revisa tu cita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Tratamiento:</span> <strong>{summary.treatment.name}</strong> ({summary.treatment.duration_minutes} min)</p>
                  <p><span className="text-muted-foreground">Profesional:</span> <strong>{summary.doctor.full_name}</strong></p>
                  <p className="capitalize">
                    <span className="text-muted-foreground">Fecha:</span>{" "}
                    <strong>{format(new Date(summary.slot), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</strong>
                  </p>
                  <p><span className="text-muted-foreground">Hora:</span> <strong>{formatSlot(summary.slot)}</strong></p>
                  <div className="flex gap-2 pt-4">
                    <StepBack onClick={() => setStep(3)} />
                    <Button onClick={confirmBooking} disabled={submitting} size="lg">
                      {submitting ? "Reservando…" : "Confirmar reserva"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StepBack({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className="mt-6">
      <ArrowLeft className="size-4" /> Atrás
    </Button>
  );
}
