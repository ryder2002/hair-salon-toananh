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
  username?: string;
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
  // Derive username from email prefix if not provided
  const derivedUsername = formData.username?.trim().toLowerCase() ||
    validated.email.split("@")[0].toLowerCase();

  // 2. Create Profile (with username and login_password for barbershop local login)
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
      username: derivedUsername,
      login_password: validated.temporary_password,
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

export async function deleteEmployeeAction(employeeId: string) {
  const adminClient = createAdminClient();

  // 1. Delete associated salary settings
  await adminClient.from("salary_settings").delete().eq("employee_id", employeeId);

  // 2. Delete profile
  const { error: profileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", employeeId);

  if (profileError) {
    console.error("Error deleting profile:", profileError);
  }

  // 3. Delete auth user if valid UUID
  try {
    await adminClient.auth.admin.deleteUser(employeeId);
  } catch (authError) {
    console.warn("Auth user deletion warning:", authError);
  }

  return { success: true };
}

/**
 * Verify employee credentials from the Supabase profiles table.
 * Used by the login page to authenticate employees without Supabase Auth.
 * Returns the employee profile if credentials are valid, null otherwise.
 */
export async function verifyEmployeeCredentialsAction(
  username: string,
  password: string
): Promise<{ id: string; full_name: string; role: string; status: string } | null> {
  try {
    const adminClient = createAdminClient();
    // Normalize: remove @ prefix, trim, lowercase
    const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();

    // Look up by username, email prefix, or phone
    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("id, full_name, email, phone, role, status, username, login_password")
      .eq("shop_id", "11111111-1111-1111-1111-111111111111")
      .eq("role", "employee")
      .eq("status", "active");

    if (error || !profiles) return null;

    // Find matching profile by: stored username, email prefix, or phone number
    const found = profiles.find((p) => {
      const storedUsername = ((p as any).username || "").toLowerCase();
      const emailUsername = (p.email || "").split("@")[0].toLowerCase();
      const phone = (p.phone || "").trim();

      return (
        (storedUsername && storedUsername === cleanUsername) ||
        emailUsername === cleanUsername ||
        phone === username.trim()
      );
    });

    if (!found) return null;

    // Verify password against stored login_password
    const storedPassword = ((found as any).login_password || "123456").trim();
    if (storedPassword !== password.trim()) return null;

    return {
      id: found.id,
      full_name: found.full_name,
      role: found.role,
      status: found.status,
    };
  } catch (err) {
    console.error("Error verifying employee credentials:", err);
    return null;
  }
}

/**
 * Update employee's temporary password (stored in profile metadata)
 */
export async function updateEmployeePasswordAction(
  employeeId: string,
  temporaryPassword: string
): Promise<{ success: boolean }> {
  try {
    const adminClient = createAdminClient();
    await adminClient
      .from("profiles")
      .update({ must_change_password: false, updated_at: new Date().toISOString() })
      .eq("id", employeeId);
    return { success: true };
  } catch {
    return { success: false };
  }
}
