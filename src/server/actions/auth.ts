"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveLoginIdentifierAction(identifier: string) {
  const value = identifier.replace(/^@/, "").trim().toLowerCase();
  if (!value) return null;

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, username, phone, full_name, role, status, must_change_password")
    .eq("status", "active");

  if (error || !profiles) return null;
  const digits = value.replace(/\D/g, "");
  return profiles.find((profile) => {
    const email = (profile.email || "").toLowerCase();
    const username = (profile.username || email.split("@")[0]).toLowerCase();
    const phone = (profile.phone || "").replace(/\D/g, "");
    return email === value || username === value || (digits.length >= 8 && phone === digits);
  }) || null;
}
