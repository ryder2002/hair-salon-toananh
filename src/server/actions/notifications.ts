"use server";

import { requireActiveProfile } from "@/lib/supabase/authz";

export async function fetchNotificationsAction() {
  const { profile, supabase } = await requireActiveProfile();
  const { data, error } = await supabase.from("notifications").select("id, type, title, message, data, read_at, created_at").eq("recipient_id", profile.id).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchUnreadNotificationCountAction(): Promise<number> {
  const { profile, supabase } = await requireActiveProfile();
  const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", profile.id).is("read_at", null);
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function markAllNotificationsReadAction() {
  const { profile, supabase } = await requireActiveProfile();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", profile.id).is("read_at", null);
  if (error) throw new Error(error.message);
  return { success: true };
}
