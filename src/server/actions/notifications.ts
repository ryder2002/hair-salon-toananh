"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchNotificationsAction() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data;
}

export async function fetchUnreadNotificationCountAction(): Promise<number> {
  const adminClient = createAdminClient();
  const { count, error } = await adminClient
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) return 0;
  return count || 0;
}

export async function markAllNotificationsReadAction() {
  const adminClient = createAdminClient();
  await adminClient
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}
