"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Mail, Phone, GraduationCap, BookOpen, Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PerfilData {
  name: string | null;
  email: string | null;
  rol: string;
  telefono: string | null;
  docente: { especialidad: string | null; titulo: string | null; telefono: string | null } | null;
  estudiante: { matricula: string; semestreActual: number; mallaCurricular: { nombre: string } } | null;
}

export function TabInfoPersonal({ perfil }: { perfil: PerfilData }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(perfil.name ?? "");
  const [telefono, setTelefono] = useState(perfil.telefono ?? perfil.docente?.telefono ?? "");
  const [especialidad, setEspecialidad] = useState(perfil.docente?.especialidad ?? "");
  const [titulo, setTitulo] = useState(perfil.docente?.titulo ?? "");

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { name, telefono };
      if (perfil.docente) {
        body.especialidad = especialidad;
        body.titulo = titulo;
      }
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al guardar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Perfil actualizado correctamente");
    },
    onError: () => toast.error("Error al actualizar el perfil"),
  });

  return (
    <div className="space-y-6">
      {/* Datos generales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos Personales</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  Nombre Completo
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Correo Electrónico
                </Label>
                <Input value={perfil.email ?? ""} disabled className="bg-gray-50" />
                <p className="text-[11px] text-muted-foreground">El correo no se puede modificar</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Teléfono
                </Label>
                <Input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+591 7XXXXXXX"
                />
              </div>
            </div>

            {/* Campos adicionales para docente */}
            {perfil.docente && (
              <>
                <div className="border-t pt-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Información Académica del Docente
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label>Título Académico</Label>
                      <Input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ej: Doctor en Ciencias..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Especialidad</Label>
                      <Input
                        value={especialidad}
                        onChange={(e) => setEspecialidad(e.target.value)}
                        placeholder="Ej: Matemáticas, Informática..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info de solo lectura para estudiante */}
      {perfil.estudiante && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Información Académica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Matrícula</p>
                <p className="text-sm font-semibold text-foreground">{perfil.estudiante.matricula}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Carrera</p>
                <p className="text-sm font-semibold text-foreground">{perfil.estudiante.mallaCurricular.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Semestre Actual</p>
                <p className="text-sm font-semibold text-foreground">{perfil.estudiante.semestreActual}° Semestre</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">Esta información es gestionada por la unidad académica</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
