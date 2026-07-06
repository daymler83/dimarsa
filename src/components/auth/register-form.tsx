"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { registerSeller } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validations";
import type { AuthActionState } from "@/types/auth";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-light" disabled={pending}>
      {pending ? "Creando cuenta..." : "Crear cuenta"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(registerSeller, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string[] | undefined>>({});

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader className="space-y-4">
        <Badge className="w-fit bg-gold text-navy hover:bg-gold-light">Registro de vendedor</Badge>
        <div className="space-y-2">
          <CardTitle className="text-3xl text-navy">Empieza a vender con tu link propio</CardTitle>
          <CardDescription>
            Crea tu cuenta para recibir tu código de vendedor y compartir tu catálogo desde hoy.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="space-y-5"
          onSubmit={(event) => {
            const formData = new FormData(event.currentTarget);
            const parsed = registerSchema.safeParse({
              fullName: formData.get("fullName"),
              email: formData.get("email"),
              phone: formData.get("phone"),
              password: formData.get("password"),
            });

            if (!parsed.success) {
              event.preventDefault();
              setClientErrors(parsed.error.flatten().fieldErrors);
              return;
            }

            setClientErrors({});
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" name="fullName" placeholder="Tu nombre y apellido" />
            <p className="text-sm text-error">{clientErrors.fullName?.[0] ?? state.fieldErrors?.fullName?.[0]}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="nombre@correo.cl" />
            <p className="text-sm text-error">{clientErrors.email?.[0] ?? state.fieldErrors?.email?.[0]}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+56 9 1234 5678" />
            <p className="text-sm text-error">{clientErrors.phone?.[0] ?? state.fieldErrors?.phone?.[0]}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" />
            <p className="text-sm text-error">{clientErrors.password?.[0] ?? state.fieldErrors?.password?.[0]}</p>
          </div>

          {state.message ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                state.success
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-error/20 bg-error/5 text-error"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-medium text-navy underline-offset-4 hover:underline" href="/login">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
