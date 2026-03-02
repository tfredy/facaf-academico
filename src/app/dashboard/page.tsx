import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  Users,
  UserCheck,
  GraduationCap,
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  ClipboardList,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

const rolLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ACADEMICO: "Académico",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userRol = (session.user as { rol?: string })?.rol ?? "ESTUDIANTE";

  if (userRol === "ADMIN" || userRol === "ACADEMICO") {
    return <DashboardAcademico userName={session.user?.name ?? "Usuario"} />;
  }
  if (userRol === "DOCENTE") {
    return <DashboardDocente userId={session.user.id} userName={session.user?.name ?? "Docente"} />;
  }
  return <DashboardEstudiante userId={session.user.id} userName={session.user?.name ?? "Estudiante"} />;
}

// ─── DASHBOARD ACADÉMICO / ADMIN ────────────────────────────

async function DashboardAcademico({ userName }: { userName: string }) {
  const [
    mallasCount, mallasActivas,
    docentesCount,
    estudiantesCount,
    asignaturasCount,
    inscripcionesCount, inscripcionesCursando,
    periodosActivos, totalPeriodos,
    clasesRegistradas,
    evaluacionesProgramadas,
    notifRecientes,
  ] = await Promise.all([
    prisma.mallaCurricular.count(),
    prisma.mallaCurricular.count({ where: { activa: true } }),
    prisma.docente.count(),
    prisma.estudiante.count(),
    prisma.asignatura.count(),
    prisma.inscripcion.count(),
    prisma.inscripcion.count({ where: { estado: "CURSANDO" } }),
    prisma.periodoExamen.count({ where: { habilitado: true } }),
    prisma.periodoExamen.count(),
    prisma.contenidoClase.count(),
    prisma.registroEvaluacion.count(),
    prisma.notificacion.findMany({
      where: { leida: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { usuario: { select: { name: true, rol: true } } },
    }),
  ]);

  const periodos = await prisma.periodoExamen.findMany({
    where: { habilitado: true },
    orderBy: { fechaFin: "asc" },
    take: 3,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de control del sistema académico FaCAF
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Estudiantes"
          value={estudiantesCount}
          subtitle={`${inscripcionesCursando} cursando activamente`}
          icon={Users}
          color="purple"
          href="/dashboard/academico/estudiantes"
        />
        <StatCard
          title="Docentes"
          value={docentesCount}
          subtitle={`${clasesRegistradas} clases registradas`}
          icon={UserCheck}
          color="blue"
          href="/dashboard/academico/docentes"
        />
        <StatCard
          title="Asignaturas"
          value={asignaturasCount}
          subtitle={`En ${mallasActivas} malla${mallasActivas !== 1 ? "s" : ""} activa${mallasActivas !== 1 ? "s" : ""}`}
          icon={BookOpen}
          color="emerald"
          href="/dashboard/academico/mallas"
        />
        <StatCard
          title="Inscripciones"
          value={inscripcionesCount}
          subtitle={`${evaluacionesProgramadas} evaluaciones programadas`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Sección inferior: 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Columna izquierda: Periodos + Resumen */}
        <div className="lg:col-span-3 space-y-6">
          {/* Periodos de examen activos */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Periodos de Examen
              </h2>
              <Link
                href="/dashboard/academico/periodos-examen"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {periodos.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sin periodos activos</p>
                  <p className="text-xs text-muted-foreground">No hay periodos de examen habilitados actualmente</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {periodos.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 rounded-lg border p-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Examen {p.tipo.charAt(0) + p.tipo.slice(1).toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gestión {p.gestion}-{p.periodo} · {new Date(p.fechaInicio).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })} al {new Date(p.fechaFin).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Habilitado
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen académico rápido */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Resumen Rápido
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat label="Mallas" value={mallasCount} detail={`${mallasActivas} activas`} />
              <MiniStat label="Total Periodos" value={totalPeriodos} detail={`${periodosActivos} habilitados`} />
              <MiniStat label="Clases" value={clasesRegistradas} detail="registradas" />
              <MiniStat label="Evaluaciones" value={evaluacionesProgramadas} detail="programadas" />
            </div>
          </div>
        </div>

        {/* Columna derecha: Accesos rápidos + actividad reciente */}
        <div className="lg:col-span-2 space-y-6">
          {/* Accesos rápidos */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Accesos Rápidos
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink href="/dashboard/academico/mallas" icon={BookOpen} label="Mallas" color="emerald" />
              <QuickLink href="/dashboard/academico/docentes" icon={UserCheck} label="Docentes" color="blue" />
              <QuickLink href="/dashboard/academico/estudiantes" icon={Users} label="Estudiantes" color="purple" />
              <QuickLink href="/dashboard/academico/periodos-examen" icon={Calendar} label="Periodos" color="amber" />
              <QuickLink href="/dashboard/academico/reportes" icon={BarChart3} label="Reportes" color="sky" />
              <QuickLink href="/dashboard/notificaciones" icon={ClipboardList} label="Notificaciones" color="rose" />
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Actividad Reciente
            </h2>
            {notifRecientes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sin actividad reciente</p>
            ) : (
              <div className="space-y-3">
                {notifRecientes.map((n) => (
                  <div key={n.id} className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight">{n.titulo}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.mensaje}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD DOCENTE ──────────────────────────────────────

async function DashboardDocente({ userId, userName }: { userId: string; userName: string }) {
  const docente = await prisma.docente.findUnique({
    where: { usuarioId: userId },
    include: {
      docenteAsignaturas: {
        include: {
          asignatura: { select: { nombre: true, codigo: true } },
          contenidosClase: { orderBy: { fecha: "desc" }, take: 1 },
          evaluaciones: { orderBy: { fecha: "desc" }, take: 1 },
          _count: { select: { contenidosClase: true, evaluaciones: true } },
        },
      },
      inscripciones: { where: { estado: "CURSANDO" } },
    },
  });

  const materiasActivas = docente?.docenteAsignaturas ?? [];
  const totalEstudiantes = docente?.inscripciones.length ?? 0;
  const totalClases = materiasActivas.reduce((s, m) => s + m._count.contenidosClase, 0);
  const totalEvals = materiasActivas.reduce((s, m) => s + m._count.evaluaciones, 0);

  const periodosAbiertos = await prisma.periodoExamen.findMany({
    where: { habilitado: true },
    take: 2,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hola, {userName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen de tu actividad docente · Gestión {new Date().getFullYear()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Mis Asignaturas"
          value={materiasActivas.length}
          subtitle="asignadas este periodo"
          icon={BookOpen}
          color="emerald"
          href="/dashboard/docente/mis-materias"
        />
        <StatCard
          title="Estudiantes"
          value={totalEstudiantes}
          subtitle="inscritos en mis materias"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Clases Registradas"
          value={totalClases}
          subtitle="contenidos cargados"
          icon={FileText}
          color="purple"
          href="/dashboard/docente/contenidos"
        />
        <StatCard
          title="Evaluaciones"
          value={totalEvals}
          subtitle="programadas"
          icon={ClipboardList}
          color="amber"
          href="/dashboard/docente/contenidos"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Materias con progreso */}
        <div className="lg:col-span-3 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Mis Asignaturas
            </h2>
            <Link href="/dashboard/docente/mis-materias" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {materiasActivas.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tienes asignaturas asignadas este periodo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materiasActivas.map((m) => {
                const lastClase = m.contenidosClase[0];
                const lastEval = m.evaluaciones[0];
                return (
                  <div key={m.id} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{m.asignatura.nombre}</p>
                        <p className="text-xs text-muted-foreground">{m.asignatura.codigo} · Gestión {m.gestion}-{m.periodo}</p>
                      </div>
                      <div className="flex gap-3 text-right">
                        <div>
                          <p className="text-lg font-bold text-foreground">{m._count.contenidosClase}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Clases</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{m._count.evaluaciones}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Evals</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-gray-400">
                      {lastClase && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Última clase: {new Date(lastClase.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                      {lastEval && (
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          Última eval: {new Date(lastEval.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="lg:col-span-2 space-y-6">
          {/* Periodos habilitados */}
          {periodosAbiertos.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Periodos Habilitados
              </h2>
              {periodosAbiertos.map((p) => (
                <div key={p.id} className="flex items-center gap-3 mb-2 last:mb-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-800">
                      Examen {p.tipo.charAt(0) + p.tipo.slice(1).toLowerCase()}
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      Hasta el {new Date(p.fechaFin).toLocaleDateString("es-BO", { day: "2-digit", month: "long" })}
                    </p>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/docente/calificaciones" className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-emerald-700 hover:underline">
                Cargar calificaciones <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Accesos rápidos docente */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Accesos Rápidos
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink href="/dashboard/docente/contenidos" icon={FileText} label="Contenidos" color="emerald" />
              <QuickLink href="/dashboard/docente/calendario" icon={Calendar} label="Calendario" color="blue" />
              <QuickLink href="/dashboard/docente/asistencia" icon={ClipboardList} label="Asistencia" color="purple" />
              <QuickLink href="/dashboard/docente/calificaciones" icon={BarChart3} label="Calificaciones" color="amber" />
              <QuickLink href="/dashboard/docente/historial" icon={Clock} label="Historial" color="gray" />
              <QuickLink href="/dashboard/perfil" icon={GraduationCap} label="Mi Perfil" color="sky" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ESTUDIANTE ───────────────────────────────────

async function DashboardEstudiante({ userId, userName }: { userId: string; userName: string }) {
  const estudiante = await prisma.estudiante.findUnique({
    where: { usuarioId: userId },
    include: {
      mallaCurricular: { select: { nombre: true, totalSemestres: true } },
      inscripciones: {
        where: { estado: "CURSANDO" },
        include: {
          asignatura: { select: { nombre: true, codigo: true } },
          calificaciones: { where: { tipoExamen: "NORMAL" } },
          asistencias: true,
          docente: { include: { usuario: { select: { name: true } } } },
        },
      },
    },
  });

  const materiasActuales = estudiante?.inscripciones ?? [];
  const totalAsistencias = materiasActuales.reduce((s, i) => s + i.asistencias.filter((a) => a.presente).length, 0);
  const totalClases = materiasActuales.reduce((s, i) => s + i.asistencias.length, 0);
  const porcentajeAsist = totalClases > 0 ? Math.round((totalAsistencias / totalClases) * 100) : 100;

  const calificacionesCount = materiasActuales.reduce((s, i) => s + i.calificaciones.length, 0);

  const promedioGeneral = (() => {
    const notas = materiasActuales
      .flatMap((i) => i.calificaciones)
      .map((c) => c.notaFinal)
      .filter((n): n is number => n !== null);
    if (notas.length === 0) return null;
    return Math.round(notas.reduce((s, n) => s + n, 0) / notas.length);
  })();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hola, {userName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {estudiante?.mallaCurricular.nombre} · {estudiante?.semestreActual}° Semestre
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Materias Cursando"
          value={materiasActuales.length}
          subtitle={`de ${estudiante?.mallaCurricular.totalSemestres ?? 10} semestres totales`}
          icon={BookOpen}
          color="emerald"
          href="/dashboard/estudiante/mis-semestres"
        />
        <StatCard
          title="Promedio General"
          value={promedioGeneral !== null ? `${promedioGeneral}` : "—"}
          subtitle={promedioGeneral !== null ? (promedioGeneral >= 51 ? "Aprobado" : "En riesgo") : "Sin calificaciones"}
          icon={BarChart3}
          color={promedioGeneral !== null && promedioGeneral >= 51 ? "blue" : "amber"}
          href="/dashboard/estudiante/mis-calificaciones"
        />
        <StatCard
          title="Asistencia"
          value={`${porcentajeAsist}%`}
          subtitle={`${totalAsistencias}/${totalClases} clases asistidas`}
          icon={CheckCircle2}
          color={porcentajeAsist >= 75 ? "purple" : "rose"}
          href="/dashboard/estudiante/mi-asistencia"
        />
        <StatCard
          title="Calificaciones"
          value={calificacionesCount}
          subtitle="notas registradas"
          icon={ClipboardList}
          color="sky"
          href="/dashboard/estudiante/mis-calificaciones"
        />
      </div>

      {/* Materias actuales */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Materias del Semestre
          </h2>
          <Link href="/dashboard/estudiante/mis-semestres" className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {materiasActuales.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tienes materias inscritas actualmente</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {materiasActuales.map((insc) => {
              const calif = insc.calificaciones[0];
              const nota = calif?.notaFinal;
              const asist = insc.asistencias.length;
              const pres = insc.asistencias.filter((a) => a.presente).length;
              return (
                <div key={insc.id} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{insc.asignatura.nombre}</p>
                      <p className="text-xs text-muted-foreground">{insc.asignatura.codigo} · {insc.docente.usuario.name}</p>
                    </div>
                    {nota !== null && nota !== undefined && (
                      <span className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        nota >= 51 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}>
                        {nota}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Asistencia: {asist > 0 ? `${Math.round((pres / asist) * 100)}%` : "—"}
                    </div>
                    {calif && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <BarChart3 className="h-3 w-3" />
                        TP: {calif.trabajoPractico ?? "—"} · EP: {calif.examenParcial ?? "—"} · EF: {calif.examenFinal ?? "—"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENTES COMPARTIDOS ────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; iconBg: string; iconText: string; border: string }> = {
  emerald: { bg: "bg-white", iconBg: "bg-emerald-100", iconText: "text-emerald-600", border: "border-emerald-100" },
  blue:    { bg: "bg-white", iconBg: "bg-blue-100",    iconText: "text-blue-600",    border: "border-blue-100" },
  purple:  { bg: "bg-white", iconBg: "bg-purple-100",  iconText: "text-purple-600",  border: "border-purple-100" },
  amber:   { bg: "bg-white", iconBg: "bg-amber-100",   iconText: "text-amber-600",   border: "border-amber-100" },
  sky:     { bg: "bg-white", iconBg: "bg-sky-100",     iconText: "text-sky-600",     border: "border-sky-100" },
  rose:    { bg: "bg-white", iconBg: "bg-rose-100",    iconText: "text-rose-600",    border: "border-rose-100" },
  gray:    { bg: "bg-white", iconBg: "bg-gray-100",    iconText: "text-gray-600",    border: "border-gray-100" },
};

function StatCard({
  title, value, subtitle, icon: Icon, color, href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: typeof BookOpen;
  color: string;
  href?: string;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.gray;
  const content = (
    <div className={`group rounded-xl border ${c.border} ${c.bg} p-5 shadow-sm hover:shadow-md transition-all duration-200 ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1.5">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.iconBg} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-6 w-6 ${c.iconText}`} />
        </div>
      </div>
      {href && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-medium text-primary">Ver detalle</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function QuickLink({
  href, icon: Icon, label, color,
}: {
  href: string;
  icon: typeof BookOpen;
  label: string;
  color: string;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.gray;
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 hover:border-gray-200 transition-all duration-200"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconBg}`}>
        <Icon className={`h-4 w-4 ${c.iconText}`} />
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}

function MiniStat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-gray-50">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`;
  if (diff < 2880) return "Ayer";
  return `Hace ${Math.floor(diff / 1440)} días`;
}
