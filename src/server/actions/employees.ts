"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmployeeCreateSchema, SalarySettingSchema } from "@/lib/validations";

export async function fetchEmployeesAction() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      job_title,
      role,
      status,
      avatar_url,
      salary_settings (base_salary, allowance, commission_rate)
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
  return data;
}

export async function createEmployeeAction(formData: {
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  temporary_password: string;
  base_salary?: number;
  allowance?: number;
  commission_rate?: number;
}) {
  const validated = EmployeeCreateSchema.parse(formData);
  const adminClient = createAdminClient();

  // 1. Create Auth user via Supabase Admin Client
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: validated.email,
    password: validated.temporary_password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    throw new Error(authError?.message || "Failed to create auth user");
  }

  const shopId = "11111111-1111-1111-1111-111111111111"; // Default Shop ID

  // 2. Create Profile
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: authUser.user.id,
      shop_id: shopId,
      full_name: validated.full_name,
      email: validated.email,
      phone: validated.phone,
      job_title: validated.job_title,
      role: "employee",
      status: "active",
      must_change_password: true,
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  // 3. Create initial salary settings
  await adminClient.from("salary_settings").insert({
    shop_id: shopId,
    employee_id: authUser.user.id,
    base_salary: formData.base_salary || 6000000,
    allowance: formData.allowance || 500000,
    commission_rate: formData.commission_rate || 8.0,
    effective_from: new Date().toISOString().split("T")[0],
    created_by: authUser.user.id,
  });

  return profile;
}

export async function toggleEmployeeStatusAction(employeeId: string, status: "active" | "inactive") {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
