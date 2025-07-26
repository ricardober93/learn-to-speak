// Tipos extendidos para BetterAuth
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}