"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { loginUser } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";
import type { AuthActionState } from "@/types/auth";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-light" disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginUser, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string[] | undefined>>({});

  return (
    <Card className="border-white/70 bg-white/95 shadow-brand">
      <CardHeader className="space-y-4">
        <Badge className="w-fit bg-cream text-navy">Acceso seguro</Badge>
        <div className="space-y-2">
          <CardTitle className="text-3xl text-navy">Ingresa a tu cuenta Dimarsa</CardTitle>
          <CardDescription>
            Accede a tu panel para compartir tu catálogo, revisar ventas y seguir tus comisiones.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="space-y-5"
          onSubmit={(event) => {
            const formData = new FormData(event.currentTarget);
            const parsed = loginSchema.safeParse({
              email: formData.get("email"),
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="nombre@correo.cl" />
            <p className="text-sm text-error">{clientErrors.email?.[0] ?? state.fieldErrors?.email?.[0]}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" placeholder="Tu contraseña" />
            <p className="text-sm text-error">{clientErrors.password?.[0] ?? state.fieldErrors?.password?.[0]}</p>
          </div>

          {state.message ? (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {state.message}
            </div>
          ) : null}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Aún no tienes cuenta?{" "}
          <Link className="font-medium text-navy underline-offset-4 hover:underline" href="/registro">
            Crear cuenta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
