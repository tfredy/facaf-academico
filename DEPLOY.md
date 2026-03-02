# Guía de despliegue — FaCAF Sistema Académico

Pasos para desplegar en **Vercel** con **Supabase** (PostgreSQL) y **Google OAuth**.

---

## 1. Crear proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta.
2. Creá un nuevo proyecto.
3. Elegí región cercana (ej. South America - São Paulo).
4. Anotá la contraseña de la base de datos (se muestra solo al crear el proyecto).
5. En **Settings → Database**, copiá la **Connection string**.
   - Usá la variante **Connection pooling** (modo Transaction) para serverless.
   - Formato: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
6. Reemplazá `[PASSWORD]` por la contraseña real.

---

## 2. Migrar la base de datos

**Importante:** Reemplazá `DATABASE_URL` en tu `.env` con la URL de Supabase. Si seguís usando la URL de SQLite, Prisma fallará (el esquema ya está configurado para PostgreSQL).

En tu proyecto local:

```bash
# Actualizá .env con DATABASE_URL de Supabase (ver paso 1)
# Ejemplo:
# DATABASE_URL="postgresql://postgres.xxxxx:tu-password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Crear tablas en Supabase
npx prisma db push

# Cargar datos iniciales
npx prisma db seed
```

---

## 3. Configurar Google OAuth (opcional)

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/).
2. Creá un proyecto nuevo o elegí uno existente.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth 2.0**.
4. Tipo de aplicación: **Aplicación web**.
5. Nombre: "FaCAF Login".
6. **URIs de redirección autorizados**, agregá:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://tu-dominio.vercel.app/api/auth/callback/google`
7. Guardá y copiá el **ID de cliente** y el **Secreto del cliente**.

**Importante:** Solo pueden iniciar sesión con Google los usuarios que ya existan en la base de datos (mismo email). Para probar, actualizá el email de un usuario en la DB a tu Gmail.

---

## 4. Desplegar en Vercel

1. Subí el código a **GitHub** (o GitLab/Bitbucket).
2. Entrá a [vercel.com](https://vercel.com) e importá el repositorio.
3. En **Project Settings → Environment Variables**, agregá:

| Variable | Valor | Notas |
|----------|-------|-------|
| `DATABASE_URL` | URL de Supabase (Connection pooling) | Requerido |
| `AUTH_SECRET` | String aleatorio de 32+ caracteres | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` | La URL final de la app |
| `AUTH_GOOGLE_ID` | ID de cliente de Google | Opcional |
| `AUTH_GOOGLE_SECRET` | Secreto de Google | Opcional |
| `NEXT_PUBLIC_GOOGLE_AUTH` | `true` | Solo si usás Google; necesario para mostrar el botón |

4. Hacé **Redeploy** para que se apliquen las variables.
5. En la primera ejecución, Vercel ejecuta `prisma generate` automáticamente. Las tablas ya deben existir en Supabase (las creaste con `prisma db push`).

---

## 5. Subida de archivos (avatar, exámenes)

En Vercel el sistema de archivos no persiste. Opciones:

- **Opción A (provisoria):** Deshabilitar o aceptar que los avatares no se guarden en producción hasta migrar a storage.
- **Opción B (recomendada):** Migrar a **Supabase Storage** para avatares y archivos de exámenes (requiere cambios de código).

---

## 6. Verificación

1. Entrá a `https://tu-proyecto.vercel.app`.
2. Redirigir al login.
3. Usuarios de prueba (Credentials): `admin@facaf.uni.edu.py`, etc. (según el seed).
4. Si configuraste Google: probá con un correo Gmail que exista en la base de datos.

---

## Resumen de variables de entorno

### Local (`.env`)

```
DATABASE_URL="postgresql://postgres.xxx:password@....pooler.supabase.com:6543/postgres?pgbouncer=true"
AUTH_SECRET="tu-secret-aleatorio-32-chars"
NEXTAUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="tu-client-id"          # opcional
AUTH_GOOGLE_SECRET="tu-client-secret"   # opcional
NEXT_PUBLIC_GOOGLE_AUTH="true"         # para mostrar botón Google
```

### Vercel

Las mismas variables, con `NEXTAUTH_URL` apuntando a la URL de producción.
