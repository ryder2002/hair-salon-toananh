"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchNotificationsAction(recipientId?: string, role?: string) {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (recipientId) {
    query = query.eq("recipient_id", recipientId);
  } else if (role === "employee") {
    query = query.neq("type", "REVENUE_RECORDED");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchUnreadNotificationCountAction(recipientId?: string, role?: string): Promise<number> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (recipientId) {
    query = query.eq("recipient_id", recipientId);
  } else if (role === "employee") {
    query = query.neq("type", "REVENUE_RECORDED");
  }

  const { count, error } = await query;

  if (error) return 0;
  return count || 0;
}

export async function markAllNotificationsReadAction(recipientId?: string) {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (recipientId) {
    query = query.eq("recipient_id", recipientId);
  }

  await query;
}
