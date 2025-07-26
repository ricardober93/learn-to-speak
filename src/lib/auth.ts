import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Cambiar a true en producción
    async sendVerificationEmail({ user, url }: { user: { email: string }; url: string }) {
      // Implementar envío de email en producción
      console.log(`Verification email for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // 1 día
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false,
      },
    },
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  plugins: [],
});

export type Session = typeof auth.$Infer.Session;
// export type User = typeof auth.$Infer.User; // Comentado temporalmente debido a error de tipo