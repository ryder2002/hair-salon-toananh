"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SHOP_ID = "11111111-1111-1111-1111-111111111111";

/**
 * Log an audit entry to Supabase audit_logs table
 */
export async function logAuditAction(entry: {
  action: string;
  actorName: string;
  actorRole?: string;
  details: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    const adminClient = createAdminClient();
    await adminClient.from("audit_logs").insert({
      shop_id: SHOP_ID,
      actor_id: userData.user?.id || null,
      action: entry.action,
      entity_type: entry.entityType || "system",
      entity_id: entry.entityId || null,
      metadata: {
        actor_name: entry.actorName,
        actor_role: entry.actorRole || "admin",
        details: entry.details,
        timestamp: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      },
    });
  } catch (err) {
    console.error("Failed to log audit entry:", err);
  }
}

/**
 * Fetch audit logs from Supabase
 */
export async function fetchAuditLogsAction() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("audit_logs")
      .select("*")
      .eq("shop_id", SHOP_ID)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching audit logs:", error);
      return [];
    }

    // Transform to a display-friendly format
    return (data || []).map((log) => ({
      id: log.id,
      action: log.action,
      actorName: log.metadata?.actor_name || "Hệ thống",
      actorRole: log.metadata?.actor_role || "system",
      details: log.metadata?.details || log.action,
      timestamp:
        log.metadata?.timestamp ||
        new Date(log.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    }));
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return [];
  }
}
