"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile, requireAdmin } from "@/lib/supabase/authz";
import { RevenueEntrySchema } from "@/lib/validations";

export async function fetchRevenuesAction(date?: string) {
  const { profile, supabase } = await requireActiveProfile();
  let query = supabase
    .from("revenue_entries")
    .select("id, amount, payment_method, service_name, note, business_date, performed_at, status, employee_id, created_by, profiles:employee_id(full_name, avatar_url)")
    .eq("shop_id", profile.shop_id)
    .order("performed_at", { ascending: false })
    .limit(500);
  if (date) query = query.eq("business_date", date);
  if (profile.role !== "admin") query = query.eq("employee_id", profile.id);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createRevenueEntryAction(formData: {
  employee_id?: string;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  service_name?: string;
  note?: string;
  business_date: string;
  idempotency_key: string;
}) {
  const { profile, supabase } = await requireActiveProfile();
  const validated = RevenueEntrySchema.parse(formData);
  const { data, error } = await supabase.rpc("record_revenue", {
    p_business_date: validated.business_date,
    p_amount: validated.amount,
    p_payment_method: validated.payment_method,
    p_service_name: validated.service_name || null,
    p_note: validated.note || null,
    p_idempotency_key: validated.idempotency_key,
    p_employee_id: profile.role === "admin" ? formData.employee_id || null : null,
  });
  if (error) throw new Error(error.message);

  // Notifications are written only after the authoritative insert succeeds.
  const row = data as any;
  if (profile.role !== "admin") {
    const admin = createAdminClient();
    const { data: admins } = await admin.from("profiles").select("id").eq("shop_id", profile.shop_id).eq("role", "admin").eq("status", "active");
    if (admins?.length) {
      await admin.from("notifications").insert(admins.map((adminProfile) => ({
        shop_id: profile.shop_id,
        recipient_id: adminProfile.id,
        type: "REVENUE_RECORDED",
        title: "Nhân viên ghi nhận doanh thu mới",
        message: `${profile.full_name} vừa ghi nhận ${validated.amount.toLocaleString("vi-VN")} đ`,
        data: { url: "/admin/revenue", revenue_id: row?.id || null },
      })));
    }
  }
  return row;
}

export async function voidRevenueEntryAction(revenueId: string, voidReason?: string) {
  const { profile, supabase } = await requireAdmin();
  if (!voidReason || voidReason.trim().length < 3) throw new Error("A void reason is required");
  const { data, error } = await supabase.from("revenue_entries")
    .update({ status: "voided", voided_at: new Date().toISOString(), voided_by: profile.id, void_reason: voidReason.trim(), updated_at: new Date().toISOString() })
    .eq("id", revenueId).eq("shop_id", profile.shop_id).eq("status", "recorded")
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRevenueEntryAction(formData: {
  id: string;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  service_name?: string;
  note?: string;
}) {
  const { profile, supabase } = await requireActiveProfile();
  if (!Number.isInteger(formData.amount) || formData.amount <= 0) throw new Error("Invalid amount");
  const { data: existing, error: existingError } = await supabase.from("revenue_entries").select("business_date").eq("id", formData.id).eq("shop_id", profile.shop_id).single();
  if (existingError) throw new Error(existingError.message);
  const { data: closing } = await supabase.from("daily_closings").select("id").eq("shop_id", profile.shop_id).eq("business_date", existing.business_date).eq("is_closed", true).maybeSingle();
  if (closing) throw new Error("Business day is closed");
  const query = supabase
    .from("revenue_entries")
    .update({ amount: formData.amount, payment_method: formData.payment_method, service_name: formData.service_name || "Dịch vụ tóc", note: formData.note, updated_at: new Date().toISOString() })
    .eq("id", formData.id).eq("shop_id", profile.shop_id).eq("status", "recorded");
  const scoped = profile.role === "admin" ? query : query.eq("employee_id", profile.id);
  const { data, error } = await scoped.select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function closeBusinessDayAction(businessDate: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("close_business_day", { p_business_date: businessDate });
  if (error) throw new Error(error.message);
  return data;
}
