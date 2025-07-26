import { NextRequest, NextResponse } from "next/server";
import { auth } from "./src/lib/auth";
import { AuthSession } from "./src/types/auth";

// Rutas que requieren autenticación
const protectedRoutes = [
  "/admin",
  "/teacher",
  "/profile",
  "/activities",
  "/progress"
];

// Rutas que requieren roles específicos
const adminRoutes = ["/admin"];
const teacherRoutes = ["/teacher", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar si la ruta necesita protección
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  try {
    // Verificar la sesión del usuario
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user) {
      // Redirigir a la página principal si no está autenticado
      const url = new URL("/", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    
    // Verificar permisos de rol
    const userRole = (session as AuthSession)?.user?.role || "USER";
    
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    
    if (teacherRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== "TEACHER" && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error("Error en middleware de autenticación:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};