"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, Lock, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export function TabSeguridad() {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/perfil/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordActual, passwordNueva }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      return data;
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirm("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const minLength = passwordNueva.length >= 6;
  const hasUpper = /[A-Z]/.test(passwordNueva);
  const hasNumber = /[0-9]/.test(passwordNueva);
  const passwordsMatch = passwordNueva === passwordConfirm && passwordConfirm.length > 0;
  const canSubmit = minLength && passwordsMatch && !mutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}
            className="space-y-5 max-w-md"
          >
            {/* Contraseña actual */}
            <div className="space-y-2">
              <Label>Contraseña Actual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showActual ? "text" : "password"}
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowActual(!showActual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Si es la primera vez que estableces contraseña, deja este campo vacío
              </p>
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-2">
              <Label>Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showNueva ? "text" : "password"}
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNueva(!showNueva)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Indicadores de fuerza */}
              {passwordNueva.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-1 flex-1 rounded-full ${minLength ? "bg-emerald-500" : "bg-gray-200"}`} />
                    <div className={`h-1 flex-1 rounded-full ${hasUpper ? "bg-emerald-500" : "bg-gray-200"}`} />
                    <div className={`h-1 flex-1 rounded-full ${hasNumber ? "bg-emerald-500" : "bg-gray-200"}`} />
                  </div>
                  <div className="space-y-0.5">
                    <RequisitoItem ok={minLength} text="Mínimo 6 caracteres" />
                    <RequisitoItem ok={hasUpper} text="Al menos una mayúscula" />
                    <RequisitoItem ok={hasNumber} text="Al menos un número" />
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div className="space-y-2">
              <Label>Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordConfirm.length > 0 && !passwordsMatch && (
                <p className="text-xs text-accent">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
              {mutation.isPending ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Alert variant="info">
        <Shield className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Recomendaciones de seguridad</p>
          <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
            <li>Usa una contraseña única que no uses en otros sitios</li>
            <li>No compartas tu contraseña con nadie</li>
            <li>Cambia tu contraseña periódicamente</li>
            <li>Cierra sesión al usar equipos compartidos</li>
          </ul>
        </div>
      </Alert>
    </div>
  );
}

function RequisitoItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Check className={`h-3 w-3 ${ok ? "text-emerald-500" : "text-gray-300"}`} />
      <span className={`text-[11px] ${ok ? "text-emerald-600" : "text-gray-400"}`}>{text}</span>
    </div>
  );
}
