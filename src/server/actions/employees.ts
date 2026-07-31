"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveProfile, requireAdmin } from "@/lib/supabase/authz";
import { EmployeeCreateSchema } from "@/lib/validations";

export async function fetchEmployeesAction() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, username, phone, job_title, role, status, avatar_url, created_at, salary_settings:salary_settings!salary_settings_employee_id_fkey(base_salary, allowance, commission_rate)")
    .eq("role", "employee")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createEmployeeAction(formData: {
  full_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  temporary_password?: string;
  username?: string;
  base_salary?: number;
  allowance?: number;
  commission_rate?: number;
}) {
  const { profile: adminProfile } = await requireAdmin();
  const parsed = EmployeeCreateSchema.parse(formData);
  const adminClient = createAdminClient();
  const username = (formData.username || formData.full_name).replace(/^@/, "").trim().toLowerCase();
  const email = (formData.email || `${username}@barbershop.local`).trim().toLowerCase();
  const password = (formData.temporary_password || "").trim();
  if (password.length < 8) throw new Error("Temporary password must be at least 8 characters");

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authData.user) throw new Error(authError?.message || "Unable to create Auth user");

  const userId = authData.user.id;
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: userId,
      shop_id: adminProfile.shop_id,
      full_name: parsed.full_name.trim(),
      email,
      username,
      phone: (parsed.phone || "").trim(),
      job_title: (parsed.job_title || "Thợ cắt tóc").trim(),
      role: "employee",
      status: "active",
      must_change_password: true,
    })
    .select()
    .single();

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  const { error: salaryError } = await adminClient.from("salary_settings").insert({
    shop_id: adminProfile.shop_id,
    employee_id: userId,
    base_salary: formData.base_salary ?? 6000000,
    allowance: formData.allowance ?? 500000,
    commission_rate: formData.commission_rate ?? 8,
    effective_from: new Date().toISOString().slice(0, 10),
    created_by: adminProfile.id,
  });
  if (salaryError) throw new Error(salaryError.message);
  return profile;
}

export async function toggleEmployeeStatusAction(employeeId: string, status: "active" | "inactive") {
  const { profile: adminProfile, supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("shop_id", adminProfile.shop_id)
    .eq("role", "employee")
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEmployeeAction(employeeId: string) {
  const { profile: adminProfile } = await requireAdmin();
  const adminClient = createAdminClient();
  const { data: target } = await adminClient.from("profiles").select("id").eq("id", employeeId).eq("shop_id", adminProfile.shop_id).eq("role", "employee").maybeSingle();
  if (!target) throw new Error("Employee not found");
  const { count } = await adminClient.from("revenue_entries").select("id", { count: "exact", head: true }).eq("employee_id", employeeId);
  if ((count || 0) > 0) throw new Error("Employee with revenue history cannot be deleted; deactivate the account instead");
  await adminClient.from("salary_settings").delete().eq("employee_id", employeeId);
  const { error } = await adminClient.from("profiles").delete().eq("id", employeeId).eq("shop_id", adminProfile.shop_id);
  if (error) throw new Error(error.message);
  await adminClient.auth.admin.deleteUser(employeeId);
  return { success: true };
}

/** Kept for compatibility with old callers, but it now verifies only Supabase Auth. */
export async function verifyEmployeeCredentialsAction(userQuery: string, passwordQuery: string) {
  const adminClient = createAdminClient();
  const value = userQuery.replace(/^@/, "").trim().toLowerCase();
  const { data: profiles } = await adminClient.from("profiles").select("id, full_name, email, username, phone, role, status").eq("status", "active");
  const profile = profiles?.find((p) => p.email?.toLowerCase() === value || p.username?.toLowerCase() === value || p.phone?.replace(/\D/g, "") === value.replace(/\D/g, ""));
  if (!profile?.email) return null;
  const { data, error } = await adminClient.auth.signInWithPassword({ email: profile.email, password: passwordQuery });
  if (error || !data.user) return null;
  return { id: profile.id, full_name: profile.full_name, role: profile.role, status: profile.status };
}

export async function changeUserPasswordAction(formData: {
  oldPassword: string;
  newPassword: string;
}) {
  const { profile, user } = await requireActiveProfile();
  const newPassword = formData.newPassword.trim();
  if (newPassword.length < 8) return { success: false, error: "Mật khẩu mới phải từ 8 ký tự trở lên" };
  if (!formData.oldPassword) return { success: false, error: "Vui lòng nhập mật khẩu hiện tại" };

  const adminClient = createAdminClient();
  const { data: verified, error: verifyError } = await adminClient.auth.signInWithPassword({
    email: profile.email || user.email || "",
    password: formData.oldPassword,
  });
  if (verifyError || verified.user?.id !== user.id) return { success: false, error: "Mật khẩu hiện tại không đúng" };

  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, { password: newPassword });
  if (updateError) return { success: false, error: updateError.message };
  const { error: profileError } = await adminClient.from("profiles").update({ must_change_password: false, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (profileError) return { success: false, error: profileError.message };
  return { success: true };
}

export async function updateEmployeePasswordAction(employeeId: string, temporaryPassword: string) {
  const { profile } = await requireAdmin();
  if (temporaryPassword.trim().length < 8) return { success: false, error: "Mật khẩu phải từ 8 ký tự trở lên" };
  const adminClient = createAdminClient();
  const { data: target } = await adminClient.from("profiles").select("id").eq("id", employeeId).eq("shop_id", profile.shop_id).eq("role", "employee").maybeSingle();
  if (!target) return { success: false, error: "Không tìm thấy nhân viên" };
  const { error } = await adminClient.auth.admin.updateUserById(employeeId, { password: temporaryPassword.trim() });
  if (error) return { success: false, error: error.message };
  await adminClient.from("profiles").update({ must_change_password: true, updated_at: new Date().toISOString() }).eq("id", employeeId);
  return { success: true };
}
