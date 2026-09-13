import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Treatment = Database["public"]["Tables"]["treatments"]["Row"];
export type Doctor = Database["public"]["Tables"]["doctors"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export type AppointmentDetail = Appointment & {
  doctors: Pick<Doctor, "full_name" | "specialty"> | null;
  treatments: Pick<Treatment, "name" | "duration_minutes"> | null;
  profiles?: { full_name: string; phone: string | null } | null;
};

export const CLINIC = {
  name: "Clínica Dental Sonrisa",
  phone: "+34 910 123 456",
  email: "hola@clinicasonrisa.es",
  address: "Calle de la Salud 24, 28004 Madrid",
  hours: "Lunes a viernes 9:00–14:00 y 16:00–19:30 · Sábados 10:00–13:30",
};

export async function fetchTreatments(): Promise<Treatment[]> {
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSlots(doctorId: string, date: string, durationMinutes: number): Promise<string[]> {
  const { data, error } = await supabase.rpc("available_slots", {
    _doctor_id: doctorId,
    _date: date,
    _duration_minutes: durationMinutes,
  });
  if (error) throw error;
  return (data ?? []).map((r) => r.slot_start);
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export function formatSlot(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateEs(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
