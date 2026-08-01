import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthorizedProfile = {
  id: string;
  shop_id: string;
  full_name: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  role: "admin" | "employee";
  status: "active" | "inactive";
  must_change_password: boolean;
};

export const requireUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error("UNAUTHORIZED");
  return { supabase, user: data.session.user };
});

export const requireActiveProfile = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, shop_id, full_name, email, username, phone, role, status, must_change_password")
    .eq("id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !profile) throw new Error("ACCOUNT_INACTIVE_OR_PROFILE_MISSING");
  return { supabase, user, profile: profile as AuthorizedProfile };
});

export const requireAdmin = cache(async () => {
  const result = await requireActiveProfile();
  if (result.profile.role !== "admin") throw new Error("FORBIDDEN");
  return result;
});

export function isAuthorizationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return ["UNAUTHORIZED", "FORBIDDEN", "ACCOUNT_INACTIVE_OR_PROFILE_MISSING"].includes(message);
}
