import Link from "next/link";
import { GraduationCap, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 p-4">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="relative text-center max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl">
            <GraduationCap className="h-10 w-10" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">Sistema Académico</h1>
        <p className="text-emerald-100">
          Facultad de Ciencias Agropecuarias y Forestales
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-emerald-800 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl"
        >
          <LogIn className="h-5 w-5" />
          Interfaz de inicio de sesión
        </Link>
      </div>
    </div>
  );
}
