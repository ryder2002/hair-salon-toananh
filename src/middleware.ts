import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authRole = request.cookies.get("barbershop_auth_role")?.value;

  const isProtectedAdmin = pathname.startsWith("/admin");
  const isProtectedEmployee = pathname.startsWith("/employee");
  const isLoginPage = pathname === "/login";
  const isRootPage = pathname === "/";

  // 1. Root page -> redirect depending on auth state
  if (isRootPage) {
    if (!authRole) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(
      new URL(authRole === "admin" ? "/admin" : "/employee", request.url)
    );
  }

  // 2. Protected routes -> check auth
  if (isProtectedAdmin || isProtectedEmployee) {
    if (!authRole) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. User is on login page but already authenticated
  if (isLoginPage && authRole) {
    const targetPath = authRole === "admin" ? "/admin" : "/employee";
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, Logo.png (public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
