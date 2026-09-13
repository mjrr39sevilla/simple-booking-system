import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { CLINIC } from "@/lib/clinic";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: `Nueva contraseña — ${CLINIC.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden", path: ["confirm"] });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast.error("No se pudo actualizar la contraseña", { description: error.message });
      return;
    }
    toast.success("Contraseña actualizada");
    navigate({ to: "/mis-citas" });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Establecer nueva contraseña</CardTitle>
          <CardDescription>Introduce tu nueva contraseña para recuperar el acceso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repite la contraseña</FormLabel>
                    <FormControl><Input type="password" placeholder="Repite la contraseña" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                Guardar contraseña
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
