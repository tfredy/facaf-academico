"use client";

import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  Bell,
  Clock,
  Activity,
  Camera,
  Trash2,
} from "lucide-react";

import { TabInfoPersonal } from "./tab-info-personal";
import { TabSeguridad } from "./tab-seguridad";
import { TabNotificaciones } from "./tab-notificaciones";
import { TabSesiones } from "./tab-sesiones";
import { TabActividad } from "./tab-actividad";

interface PerfilData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  rol: string;
  telefono: string | null;
  prefNotificaciones: Record<string, boolean>;
  createdAt: string;
  docente: { especialidad: string | null; titulo: string | null; telefono: string | null } | null;
  estudiante: { matricula: string; semestreActual: number; mallaCurricular: { nombre: string } } | null;
}

const rolLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ACADEMICO: "Académico",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

const rolColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  ACADEMICO: "bg-amber-100 text-amber-700",
  DOCENTE: "bg-blue-100 text-blue-700",
  ESTUDIANTE: "bg-emerald-100 text-emerald-700",
};

export default function PerfilPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: perfil, isLoading, isError } = useQuery<PerfilData>({
    queryKey: ["perfil"],
    queryFn: async () => {
      const res = await fetch("/api/perfil");
      if (res.status === 401 || res.status === 404) {
        window.location.href = "/login";
        throw new Error("Sesión inválida");
      }
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/perfil/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Foto de perfil actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/perfil/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Foto de perfil eliminada");
    },
    onError: () => toast.error("Error al eliminar la foto"),
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB");
      return;
    }
    uploadMutation.mutate(file);
    e.target.value = "";
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-16">Cargando perfil...</p>;
  }

  if (!perfil || isError) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">No se pudo cargar el perfil. Tu sesión puede haber expirado.</p>
        <a href="/login" className="inline-block text-sm font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header del perfil */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar con overlay de cámara */}
        <div className="relative group">
          <Avatar src={perfil.image} name={perfil.name} size="xl" className="shadow-md" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-200 cursor-pointer"
          >
            <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploadMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{perfil.name ?? "Usuario"}</h1>
          <p className="text-sm text-muted-foreground">{perfil.email}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${rolColors[perfil.rol] ?? "bg-gray-100 text-gray-700"}`}>
              {rolLabels[perfil.rol] ?? perfil.rol}
            </span>
            <span className="text-xs text-muted-foreground">
              Miembro desde {new Date(perfil.createdAt).toLocaleDateString("es-BO", { month: "long", year: "numeric" })}
            </span>
          </div>
          {/* Botones de foto */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              {perfil.image ? "Cambiar foto" : "Subir foto"}
            </Button>
            {perfil.image && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { if (confirm("¿Eliminar tu foto de perfil?")) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground hover:text-accent"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Quitar
              </Button>
            )}
            <span className="text-[11px] text-gray-400">JPG, PNG o WebP · Máx 2MB</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Información</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notificaciones</span>
            <span className="sm:hidden">Notif.</span>
          </TabsTrigger>
          <TabsTrigger value="sesiones" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Accesos</span>
            <span className="sm:hidden">Accesos</span>
          </TabsTrigger>
          <TabsTrigger value="actividad" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Actividad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <TabInfoPersonal perfil={perfil} />
        </TabsContent>
        <TabsContent value="seguridad">
          <TabSeguridad />
        </TabsContent>
        <TabsContent value="notificaciones">
          <TabNotificaciones prefNotificaciones={perfil.prefNotificaciones} />
        </TabsContent>
        <TabsContent value="sesiones">
          <TabSesiones />
        </TabsContent>
        <TabsContent value="actividad">
          <TabActividad />
        </TabsContent>
      </Tabs>
    </div>
  );
}
