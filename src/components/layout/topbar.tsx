"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Menu,
  Bell,
  LogOut,
  User,
  ChevronDown,
  CheckCheck,
  Calendar,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  GraduationCap,
  FileText,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const rolLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ACADEMICO: "Académico",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

const TIPO_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  periodo_examen: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  calificacion: { icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
  asistencia: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
  contenido_clase: { icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
  evaluacion: { icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-50" },
  inscripcion: { icon: GraduationCap, color: "text-cyan-600", bg: "bg-cyan-50" },
  academico: { icon: Settings, color: "text-orange-600", bg: "bg-orange-50" },
  sistema: { icon: AlertTriangle, color: "text-gray-600", bg: "bg-gray-100" },
};

interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
}

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onMenuClick, sidebarCollapsed }: TopbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"todas" | "no_leidas">("todas");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRol = (session?.user as { rol?: string })?.rol ?? "ESTUDIANTE";

  const { data: perfilData } = useQuery<{ image: string | null }>({
    queryKey: ["perfil-avatar"],
    queryFn: async () => {
      const res = await fetch("/api/perfil");
      if (!res.ok) return { image: null };
      const data = await res.json();
      return { image: data.image };
    },
    staleTime: 60000,
  });

  const { data: notifData } = useQuery<{ notificaciones: Notificacion[]; totalNoLeidas: number }>({
    queryKey: ["notificaciones", notifTab],
    queryFn: async () => {
      const params = notifTab === "no_leidas" ? "?soloNoLeidas=true" : "";
      const res = await fetch(`/api/notificaciones${params}`);
      if (!res.ok) return { notificaciones: [], totalNoLeidas: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });

  const notificaciones = notifData?.notificaciones ?? [];
  const totalNoLeidas = notifData?.totalNoLeidas ?? 0;

  const marcarMutation = useMutation({
    mutationFn: async (body: { accion: string; id?: number }) => {
      const res = await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
      setProfileOpen(false);
    }
    if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
      setNotifOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  function handleNotifClick(notif: Notificacion) {
    if (!notif.leida) {
      marcarMutation.mutate({ accion: "marcar_leida", id: notif.id });
    }
    if (notif.enlace) {
      setNotifOpen(false);
      router.push(notif.enlace);
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b bg-topbar-bg border-topbar-border px-4 sm:px-6 transition-all duration-300",
        sidebarCollapsed ? "lg:left-16" : "lg:left-64",
        "left-0"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* ─── Notifications ─── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
          >
            <Bell className="h-5 w-5" />
            {totalNoLeidas > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {totalNoLeidas > 99 ? "99+" : totalNoLeidas}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-1 w-[380px] sm:w-[420px] rounded-xl border bg-card shadow-xl animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
                  {totalNoLeidas > 0 && (
                    <p className="text-xs text-muted-foreground">{totalNoLeidas} sin leer</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {totalNoLeidas > 0 && (
                    <button
                      onClick={() => marcarMutation.mutate({ accion: "marcar_todas" })}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary-light transition-colors duration-200"
                      title="Marcar todas como leídas"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Marcar todas</span>
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors duration-200 sm:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setNotifTab("todas")}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors duration-200 border-b-2",
                    notifTab === "todas"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas
                </button>
                <button
                  onClick={() => setNotifTab("no_leidas")}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors duration-200 border-b-2",
                    notifTab === "no_leidas"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sin leer
                  {totalNoLeidas > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent/10 px-1 text-[10px] font-bold text-accent">
                      {totalNoLeidas}
                    </span>
                  )}
                </button>
              </div>

              {/* Lista de notificaciones */}
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                {notificaciones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                      <Bell className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {notifTab === "no_leidas" ? "Todo al día" : "Sin notificaciones"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notifTab === "no_leidas"
                        ? "No tienes notificaciones pendientes"
                        : "Las notificaciones aparecerán aquí"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notificaciones.map((notif) => {
                      const config = TIPO_CONFIG[notif.tipo] ?? TIPO_CONFIG.sistema;
                      const Icon = config.icon;
                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            "group flex gap-3 px-4 py-3 transition-colors duration-200 cursor-pointer",
                            notif.leida
                              ? "hover:bg-gray-50"
                              : "bg-primary/[0.02] hover:bg-primary/[0.05]"
                          )}
                          onClick={() => handleNotifClick(notif)}
                        >
                          {/* Ícono con color por tipo */}
                          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                "text-sm leading-tight",
                                notif.leida ? "text-foreground" : "text-foreground font-semibold"
                              )}>
                                {notif.titulo}
                              </p>
                              {!notif.leida && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.mensaje}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>

                          {/* Acción rápida: eliminar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarMutation.mutate({ accion: "eliminar", id: notif.id });
                            }}
                            className="shrink-0 self-center rounded-md p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-accent hover:bg-accent-light transition-all duration-200"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notificaciones.length > 0 && (
                <div className="border-t px-4 py-2.5">
                  <button
                    onClick={() => { setNotifOpen(false); router.push("/dashboard/notificaciones"); }}
                    className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors duration-200"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Profile dropdown ─── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors duration-200"
          >
            <Avatar src={perfilData?.image} name={session?.user?.name} size="sm" />
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                {session?.user?.name ?? "Usuario"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {rolLabels[userRol] ?? userRol}
              </span>
            </div>
            <ChevronDown className={cn(
              "hidden sm:block h-4 w-4 text-muted-foreground transition-transform duration-200",
              profileOpen && "rotate-180"
            )} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg border bg-card shadow-lg py-1 animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center gap-3 px-3 py-3 border-b">
                <Avatar src={perfilData?.image} name={session?.user?.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setProfileOpen(false); router.push("/dashboard/perfil"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent-light transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
