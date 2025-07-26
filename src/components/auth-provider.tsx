"use client";

import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Better Auth doesn't use a SessionProvider like NextAuth
  // The session is managed automatically by the authClient
  return <>{children}</>;
}