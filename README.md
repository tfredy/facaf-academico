# Sistema Académico FaCAF

Sistema de gestión académica integral para la Facultad, desarrollado con Next.js, TypeScript, Prisma y PostgreSQL.

## Requisitos Previos

- **Node.js** 20+
- **Docker** y **Docker Compose** (para despliegue con base de datos)
- Credenciales de **Google OAuth** y/o **Microsoft Entra ID** (Azure AD)

## Inicio Rápido (Desarrollo)

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd app_facaf
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y completar las credenciales:

```bash
cp .env.example .env
```

Variables requeridas:
- `DATABASE_URL` - URL de conexión a PostgreSQL
- `AUTH_SECRET` - Secreto para NextAuth (generar con `openssl rand -base64 32`)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - Credenciales de Google OAuth
- `AUTH_MICROSOFT_ENTRA_ID_ID` / `AUTH_MICROSOFT_ENTRA_ID_SECRET` / `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` - Credenciales de Microsoft

### 3. Iniciar la base de datos

```bash
docker compose up db -d
```

### 4. Ejecutar migraciones y seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Acceder a `http://localhost:3000`

## Despliegue en Servidor Local (Producción)

### Opción 1: Docker Compose (Recomendado)

```bash
# Configurar .env con las credenciales de producción
docker compose up -d --build
```

Esto levanta:
- **PostgreSQL 16** en el puerto 5432
- **Next.js** (app) en el puerto 3000
- **Nginx** como reverse proxy en el puerto 80

### Opción 2: Manual

```bash
npm run build
npx prisma migrate deploy
npm start
```

## Módulos del Sistema

### Módulo Académico (Admin/Académico)
- Gestión de mallas curriculares
- Gestión de asignaturas por malla y semestre
- Registro de docentes y estudiantes
- Asignación de materias a estudiantes
- Habilitación de periodos de examen (normal, extraordinario, tercera oportunidad)
- Reportes y estadísticas con exportación PDF/Excel

### Módulo Docente
- Dashboard de materias asignadas
- Registro de asistencia por materia y fecha
- Carga de calificaciones (trabajo práctico, parcial, final)
- Carga de calificaciones condicionada a periodo habilitado
- Subida de archivos de examen
- Historial de materias agrupado por malla curricular

### Módulo Estudiante
- Seguimiento de semestres y progreso académico
- Consulta de calificaciones con filtros
- Consulta de asistencia con estadísticas

## Roles de Usuario

| Rol | Acceso |
|-----|--------|
| **ADMIN** | Acceso total al sistema |
| **ACADEMICO** | Gestión de mallas, asignaturas, docentes, estudiantes, periodos de examen, reportes |
| **DOCENTE** | Gestión de asistencia, calificaciones, historial de materias |
| **ESTUDIANTE** | Consulta de semestres, calificaciones y asistencia |

## Stack Tecnológico

- **Frontend/Backend:** Next.js 15 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Base de Datos:** PostgreSQL 16
- **ORM:** Prisma 6
- **Autenticación:** NextAuth.js v5 (Google + Microsoft OAuth)
- **Gráficos:** Recharts
- **Exportación:** jsPDF + xlsx

## Estructura del Proyecto

```
src/
  app/
    api/              # API Route Handlers
    dashboard/        # Páginas protegidas
      academico/      # Módulo académico
      docente/        # Módulo docente
      estudiante/     # Módulo estudiante
    login/            # Página de inicio de sesión
  components/
    ui/               # Componentes de interfaz
    layout/           # Sidebar y layouts
  lib/                # Utilidades y configuración
    validators/       # Schemas Zod
prisma/
  schema.prisma       # Modelo de datos
  seed.ts             # Datos de prueba
```

## Comandos Útiles

```bash
npm run dev           # Servidor de desarrollo
npm run build         # Compilar para producción
npm run lint          # Verificar código
npm run db:push       # Sincronizar schema sin migración
npm run db:migrate    # Crear migración
npm run db:studio     # Abrir Prisma Studio (explorar datos)
npm run db:seed       # Cargar datos de prueba
```
