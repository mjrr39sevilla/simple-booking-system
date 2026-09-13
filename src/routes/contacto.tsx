import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { CLINIC } from "@/lib/clinic";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: `Contacto y ubicación — ${CLINIC.name}` },
      { name: "description", content: "Horario, teléfono, dirección y formulario de contacto de nuestra clínica dental en Madrid." },
      { property: "og:title", content: `Contacto — ${CLINIC.name}` },
      { property: "og:description", content: "Horario, teléfono, dirección y formulario de contacto." },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(100),
  email: z.string().trim().email("Email no válido").max(255),
  message: z.string().trim().min(10, "Cuéntanos un poco más").max(1000),
});

function ContactPage() {
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  function onSubmit() {
    toast.success("Mensaje enviado", {
      description: "Te responderemos lo antes posible. Si es urgente, llámanos al " + CLINIC.phone,
    });
    form.reset();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Contacto y ubicación</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Estamos en el centro de Madrid. Escríbenos o llámanos y te atenderemos encantados.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm">
              <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" /><span>{CLINIC.address}</span></p>
              <p className="flex items-start gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-primary" /><a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`} className="hover:underline">{CLINIC.phone}</a></p>
              <p className="flex items-start gap-3"><Mail className="mt-0.5 size-5 shrink-0 text-primary" /><a href={`mailto:${CLINIC.email}`} className="hover:underline">{CLINIC.email}</a></p>
              <p className="flex items-start gap-3"><Clock className="mt-0.5 size-5 shrink-0 text-primary" /><span>{CLINIC.hours}</span></p>
            </CardContent>
          </Card>
          <div className="overflow-hidden rounded-xl border">
            <iframe
              title="Mapa de la clínica"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-3.708%2C40.418%2C-3.688%2C40.428&layer=mapnik&marker=40.423%2C-3.698"
              className="h-72 w-full"
              loading="lazy"
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold">Envíanos un mensaje</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl><Textarea rows={5} placeholder="¿En qué podemos ayudarte?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Enviar mensaje</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
