import { createClient } from "@/lib/supabase/client";

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "employee";
  email?: string;
  mustChangePassword?: boolean;
}

// Session identity is kept in memory for rendering convenience only. The
// authoritative session is the Supabase SSR cookie, never localStorage.
let memorySession: UserSession | null = null;

export function setAuthSession(session: UserSession) {
  memorySession = session;
}

export function getAuthSession(): UserSession | null {
  return memorySession;
}

export async function loadAuthSession(): Promise<UserSession | null> {
  if (memorySession) return memorySession;
  if (typeof window === "undefined") return null;

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, email, role, must_change_password")
    .eq("id", auth.session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!profile) return null;
  memorySession = {
    id: profile.id,
    username: profile.username || profile.email?.split("@")[0] || "",
    fullName: profile.full_name,
    role: profile.role,
    email: profile.email || auth.session?.user?.email || undefined,
    mustChangePassword: profile.must_change_password,
  };
  return memorySession;
}

export async function clearAuthSession() {
  memorySession = null;
  if (typeof window !== "undefined") {
    await createClient().auth.signOut({ scope: "local" });
  }
}
