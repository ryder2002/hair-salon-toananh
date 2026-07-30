export interface UserSession {
  username: string;
  fullName: string;
  role: "admin" | "employee";
  token: string;
}

const AUTH_COOKIE_NAME = "barbershop_auth_role";
const AUTH_STORAGE_KEY = "barbershop_user_session";

export function setAuthSession(session: UserSession) {
  if (typeof window !== "undefined") {
    // Set cookie for Next.js Middleware (expires in 30 days)
    document.cookie = `${AUTH_COOKIE_NAME}=${session.role}; path=/; max-age=2592000; SameSite=Lax`;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

export function getAuthSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
