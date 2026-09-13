import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CLINIC, fetchDoctors, formatSlot, STATUS_LABELS, type AppointmentDetail } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: `Panel de clínica — ${CLINIC.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [day, setDay] = useState(() => new Date());
  const [doctorFilter, setDoctorFilter] = useState<string>("all");

  const { data: doctors } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });

  const dayRange = useMemo(() => {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [day]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-appointments", dayRange.start, doctorFilter],
    enabled: !!session && isAdmin,
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("*, doctors(full_name, specialty), treatments(name, duration_minutes)")
        .gte("starts_at", dayRange.start)
        .lte("starts_at", dayRange.end)
        .order("starts_at");
      if (doctorFilter !== "all") q = q.eq("doctor_id", doctorFilter);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as AppointmentDetail[];
      const patientIds = [...new Set(rows.map((r) => r.patient_id))];
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", patientIds);
        const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
        rows.forEach((r) => { r.profiles = byId.get(r.patient_id) ?? null; });
      }
      return rows;
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast.error("No se pudo actualizar la cita");
      return;
    }
    toast.success("Cita actualizada");
    queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-muted-foreground">Cargando…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <ShieldAlert className="size-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Acceso restringido</h1>
        <p className="text-muted-foreground">
          Esta zona es solo para el personal de la clínica. Si crees que deberías tener acceso, contacta con la administración.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Agenda de la clínica</h1>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDay((d) => subDays(d, 1))} aria-label="Día anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-52 text-center font-medium capitalize">
            {format(day, "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <Button variant="outline" size="icon" onClick={() => setDay((d) => addDays(d, 1))} aria-label="Día siguiente">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDay(new Date())}>Hoy</Button>
        </div>

        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos los doctores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los doctores</SelectItem>
            {(doctors ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Cargando agenda…</p>
      ) : (appointments ?? []).length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay citas para este día.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {(appointments ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">
                    {formatSlot(a.starts_at)} — {a.treatments?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {a.doctors?.full_name} · Paciente: {a.profiles?.full_name || "Sin nombre"}
                    {a.profiles?.phone ? ` · ${a.profiles.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                  {a.status === "pending" && (
                    <Button size="sm" onClick={() => setStatus(a.id, "confirmed")}>Confirmar</Button>
                  )}
                  {(a.status === "pending" || a.status === "confirmed") && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "completed")}>
                        Completada
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setStatus(a.id, "cancelled")}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
