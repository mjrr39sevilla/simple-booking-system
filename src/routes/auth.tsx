import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { CLINIC } from "@/lib/clinic";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" && search["redirect"].startsWith("/") ? search["redirect"] : "/mis-citas",
  }),
  head: () => ({
    meta: [
      { title: `Acceder — ${CLINIC.name}` },
      { name: "description", content: "Accede a tu cuenta de paciente o crea una cuenta nueva para reservar y gestionar tus citas." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Email no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Escribe tu nombre").max(100),
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: redirect, replace: true });
  }, [session, navigate, redirect]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error("No se pudo iniciar sesión", { description: "Revisa tu email y contraseña." });
      return;
    }
    navigate({ to: redirect });
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error("No se pudo crear la cuenta", { description: error.message });
      return;
    }
    toast.success("Cuenta creada", {
      description: "Revisa tu correo para confirmar la cuenta y después inicia sesión.",
    });
  }

  async function onReset(values: z.infer<typeof loginSchema>) {
    if (!values.email) {
      toast.error("Escribe tu email primero");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("No se pudo enviar el correo", { description: error.message });
      return;
    }
    toast.success("Correo enviado", { description: "Revisa tu bandeja para restablecer la contraseña." });
    setResetMode(false);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Smile className="size-6" />
          </div>
          <CardTitle className="font-display text-2xl">Área de pacientes</CardTitle>
          <CardDescription>Accede para reservar y gestionar tus citas</CardDescription>
        </CardHeader>
        <CardContent>
          {resetMode ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onReset)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Enviar correo de recuperación</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
                  Volver
                </Button>
              </form>
            </Form>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
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
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                      Entrar
                    </Button>
                    <button
                      type="button"
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
                      onClick={() => setResetMode(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="mt-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
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
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                      Crear cuenta
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
