"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Users,
  UserCheck,
  ClipboardList,
  Calendar,
  History,
  BarChart3,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileText,
  Building2,
  Clock,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "General",
    items: [
      {
        title: "Inicio",
        href: "/dashboard",
        icon: Home,
        roles: ["ADMIN", "ACADEMICO", "DOCENTE", "ESTUDIANTE"],
      },
    ],
  },
  {
    label: "Gestión Académica",
    items: [
      {
        title: "Sedes",
        href: "/dashboard/academico/sedes",
        icon: Building2,
        roles: ["ADMIN", "ACADEMICO"],
      },
      {
        title: "Mallas Curriculares",
        href: "/dashboard/academico/mallas",
        icon: BookOpen,
        roles: ["ADMIN", "ACADEMICO"],
      },
      {
        title: "Docentes",
        href: "/dashboard/academico/docentes",
        icon: UserCheck,
        roles: ["ADMIN", "ACADEMICO"],
      },
      {
        title: "Estudiantes",
        href: "/dashboard/academico/estudiantes",
        icon: Users,
        roles: ["ADMIN", "ACADEMICO"],
      },
      {
        title: "Horarios",
        href: "/dashboard/academico/horarios",
        icon: Clock,
        roles: ["ADMIN", "ACADEMICO"],
      },
      {
        title: "Periodos de Examen",
        href: "/dashboard/academico/periodos-examen",
        icon: Calendar,
        roles: ["ADMIN", "ACADEMICO"],
      },
      {
        title: "Reportes",
        href: "/dashboard/academico/reportes",
        icon: FileBarChart,
        roles: ["ADMIN", "ACADEMICO"],
      },
    ],
  },
  {
    label: "Docente",
    items: [
      {
        title: "Mis Materias",
        href: "/dashboard/docente/mis-materias",
        icon: BookOpen,
        roles: ["DOCENTE"],
      },
      {
        title: "Contenidos",
        href: "/dashboard/docente/contenidos",
        icon: FileText,
        roles: ["DOCENTE"],
      },
      {
        title: "Calendario",
        href: "/dashboard/docente/calendario",
        icon: Calendar,
        roles: ["DOCENTE"],
      },
      {
        title: "Asistencia",
        href: "/dashboard/docente/asistencia",
        icon: ClipboardList,
        roles: ["DOCENTE"],
      },
      {
        title: "Calificaciones",
        href: "/dashboard/docente/calificaciones",
        icon: BarChart3,
        roles: ["DOCENTE"],
      },
      {
        title: "Historial",
        href: "/dashboard/docente/historial",
        icon: History,
        roles: ["DOCENTE"],
      },
    ],
  },
  {
    label: "Estudiante",
    items: [
      {
        title: "Mis Semestres",
        href: "/dashboard/estudiante/mis-semestres",
        icon: BookOpen,
        roles: ["ESTUDIANTE"],
      },
      {
        title: "Mis Calificaciones",
        href: "/dashboard/estudiante/mis-calificaciones",
        icon: BarChart3,
        roles: ["ESTUDIANTE"],
      },
      {
        title: "Mi Asistencia",
        href: "/dashboard/estudiante/mi-asistencia",
        icon: ClipboardList,
        roles: ["ESTUDIANTE"],
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRol = (session?.user as { rol?: string })?.rol ?? "ESTUDIANTE";

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(userRol)),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar-bg">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border h-16 px-4 shrink-0",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">FaCAF</span>
            <span className="text-[10px] text-sidebar-muted truncate">Sistema Académico</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {filteredSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-sidebar-active text-white font-medium"
                        : "text-sidebar-fg hover:bg-sidebar-hover hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle - desktop only */}
      <div className="hidden lg:flex border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-md py-2 text-sidebar-muted hover:bg-sidebar-hover hover:text-white transition-colors duration-200"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-screen transition-all duration-300 ease-in-out lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
