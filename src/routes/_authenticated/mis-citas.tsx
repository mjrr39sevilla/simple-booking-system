import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CLINIC, formatDateEs, formatSlot, STATUS_LABELS, type AppointmentDetail } from "@/lib/clinic";

export const Route = createFileRoute("/_authenticated/mis-citas")({
  head: () => ({
    meta: [
      { title: `Mis citas — ${CLINIC.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyAppointmentsPage,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

function MyAppointmentsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["my-appointments", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(full_name, specialty), treatments(name, duration_minutes)")
        .eq("patient_id", session!.user.id)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AppointmentDetail[];
    },
  });

  async function cancelAppointment(id: string) {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      toast.error("No se pudo cancelar la cita");
      return;
    }
    toast.success("Cita cancelada");
    queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
  }

  const now = new Date();
  const upcoming = (appointments ?? []).filter(
    (a) => new Date(a.starts_at) >= now && a.status !== "cancelled"
  );
  const past = (appointments ?? []).filter(
    (a) => new Date(a.starts_at) < now || a.status === "cancelled"
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Mis citas</h1>
        <Button asChild>
          <Link to="/reservar"><Plus className="size-4" />Nueva cita</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Cargando tus citas…</p>
      ) : (
        <>
          <h2 className="mt-8 text-lg font-semibold">Próximas</h2>
          {upcoming.length === 0 ? (
            <Card className="mt-3">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <CalendarDays className="size-10 text-muted-foreground" />
                <p className="text-muted-foreground">No tienes citas próximas.</p>
                <Button asChild variant="outline">
                  <Link to="/reservar">Reservar una cita</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-3 space-y-3">
              {upcoming.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">{a.treatments?.name}</p>
                      <p className="text-sm text-muted-foreground">{a.doctors?.full_name}</p>
                      <p className="mt-1 text-sm capitalize">
                        {formatDateEs(a.starts_at)} · {formatSlot(a.starts_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">Cancelar</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se liberará el hueco para otros pacientes. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Volver</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelAppointment(a.id)}>
                              Sí, cancelar cita
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <h2 className="mt-10 text-lg font-semibold">Historial</h2>
              <div className="mt-3 space-y-3">
                {past.map((a) => (
                  <Card key={a.id} className="opacity-75">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div>
                        <p className="font-medium">{a.treatments?.name}</p>
                        <p className="text-sm text-muted-foreground">{a.doctors?.full_name}</p>
                        <p className="mt-1 text-sm capitalize">
                          {formatDateEs(a.starts_at)} · {formatSlot(a.starts_at)}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
