"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Shield, BookOpen, UserCheck, Users, Loader2 } from "lucide-react";

const devUsers = [
  {
    email: "admin@facaf.uni.edu.py",
    name: "Administrador FaCAF",
    rol: "ADMIN",
    icon: Shield,
    accent: "border-l-red-600",
    badge: "bg-red-50 text-red-700",
  },
  {
    email: "academico@facaf.uni.edu.py",
    name: "Unidad Académica",
    rol: "ACADEMICO",
    icon: BookOpen,
    accent: "border-l-blue-600",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    email: "c.ramirez@facaf.uni.edu.py",
    name: "Ing. Agr. Carlos Ramírez",
    rol: "DOCENTE",
    icon: UserCheck,
    accent: "border-l-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  {
    email: "f.gimenez@facaf.uni.edu.py",
    name: "Dr. Fernando Giménez",
    rol: "DOCENTE",
    icon: UserCheck,
    accent: "border-l-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  {
    email: "est001@facaf.uni.edu.py",
    name: "Diego Arce",
    rol: "ESTUDIANTE",
    icon: Users,
    accent: "border-l-purple-600",
    badge: "bg-purple-50 text-purple-700",
  },
  {
    email: "est061@facaf.uni.edu.py",
    name: "Bruno Agüero",
    rol: "ESTUDIANTE",
    icon: Users,
    accent: "border-l-purple-600",
    badge: "bg-purple-50 text-purple-700",
  },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [loading, setLoading] = useState<string | null>(null);

  const showGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

  async function handleLogin(email: string) {
    setLoading(`cred-${email}`);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    await signIn("credentials", {
      email,
      callbackUrl: `${baseUrl}/dashboard`,
      redirect: true,
    });
  }

  async function handleGoogleLogin() {
    setLoading("google");
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    await signIn("google", {
      callbackUrl: `${baseUrl}/dashboard`,
      redirect: true,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 p-4">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <Card className="relative w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Sistema Académico</CardTitle>
          <CardDescription className="text-muted-foreground">
            Facultad de Ciencias Agropecuarias y Forestales
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {errorParam === "Config" && (
            <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-sm text-amber-700 text-center">
                Error de conexión. Verificá que la base de datos esté activa y las variables de entorno correctas.
              </p>
            </div>
          )}
          {errorParam === "NoAutorizado" && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-sm text-red-700 text-center">
                Tu correo no está registrado en el sistema. Contactá a la Unidad Académica.
              </p>
            </div>
          )}

          {showGoogle && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-4"
            >
              {loading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>
          )}

          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs text-amber-700 text-center">
              Modo desarrollo — Selecciona un perfil para ingresar
            </p>
          </div>

          <div className="space-y-1.5">
            {devUsers.map((user) => {
              const Icon = user.icon;
              return (
                <button
                  key={user.email}
                  onClick={() => handleLogin(user.email)}
                  disabled={loading !== null}
                  className={`w-full flex items-center gap-3 rounded-lg border border-gray-200 border-l-4 ${user.accent} bg-white p-3 text-left transition-all duration-200 hover:shadow-md hover:border-gray-300 disabled:opacity-50 group`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 group-hover:bg-gray-100 transition-colors duration-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${user.badge}`}>
                    {user.rol}
                  </span>
                  {loading === user.email && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
