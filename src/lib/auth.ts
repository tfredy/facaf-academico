import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { registrarSesionLogin } from "@/lib/actividad";
import { registrarActividad } from "@/lib/actividad";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rol: string;
    };
  }
  interface User {
    rol?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // necesario en Vercel
  providers: [
    Credentials({
      name: "Acceso Directo",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          rol: user.rol,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        registrarSesionLogin({
          usuarioId: user.id,
          navegador: "Web",
          dispositivo: "Escritorio",
          exitoso: true,
        }).catch(() => {});
        registrarActividad({
          usuarioId: user.id,
          accion: "login",
          entidad: "sesion",
          detalle: "Inicio de sesión",
        }).catch(() => {});
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Solo permitir Google si el email existe en nuestra base de datos
      if (account?.provider === "google" && user?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existingUser) {
          return "/login?error=NoAutorizado";
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.rol = dbUser.rol;
          token.name = dbUser.name ?? user.name;
          token.picture = dbUser.image ?? user.image;
        }
      } else if (user) {
        token.id = user.id;
        token.rol = user.rol ?? "ESTUDIANTE";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
