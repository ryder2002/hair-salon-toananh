"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile, requireAdmin } from "@/lib/supabase/authz";

const SHOP_ID = "11111111-1111-1111-1111-111111111111";

export async function logAuditAction(entry: {
  action: string;
  actorName?: string;
  actorRole?: string;
  details?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { profile } = await requireActiveProfile();
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    shop_id: profile.shop_id || SHOP_ID,
    actor_id: profile.id,
    action: entry.action,
    entity_type: entry.entityType || "system",
    entity_id: entry.entityId || null,
    metadata: {
      actor_name: profile.full_name,
      actor_role: profile.role,
      details: entry.details || entry.action,
      ...(entry.metadata || {}),
    },
  });
  if (error) throw new Error(error.message);
}

export async function fetchAuditLogsAction() {
  const { profile } = await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.from("audit_logs").select("id, action, metadata, created_at").eq("shop_id", profile.shop_id).order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return (data || []).map((log) => ({
    id: log.id,
    action: log.action,
    actorName: log.metadata?.actor_name || "Hệ thống",
    actorRole: log.metadata?.actor_role || "system",
    details: log.metadata?.details || log.action,
    timestamp: new Date(log.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
  }));
}
