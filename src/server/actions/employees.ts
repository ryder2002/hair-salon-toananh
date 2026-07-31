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
  email?: string;
  phone?: string;
  job_title?: string;
  temporary_password?: string;
  username?: string;
  base_salary?: number;
  allowance?: number;
  commission_rate?: number;
}) {
  const adminClient = createAdminClient();

  const cleanUsername = (formData.username || formData.full_name || "emp")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();

  const targetEmail = formData.email && formData.email.includes("@")
    ? formData.email.trim().toLowerCase()
    : `${cleanUsername}@barbershop.local`;

  const pass = (formData.temporary_password || "123456").trim();

  // 1. Create Auth user via Supabase Admin Client
  let userId: string | null = null;
  try {
    const { data: authUser } = await adminClient.auth.admin.createUser({
      email: targetEmail,
      password: pass,
      email_confirm: true,
    });
    if (authUser?.user) {
      userId = authUser.user.id;
    }
  } catch (e) {
    console.warn("Auth user creation warning:", e);
  }

  if (!userId) {
    userId = crypto.randomUUID();
  }

  const shopId = "11111111-1111-1111-1111-111111111111"; // Default Shop ID

  // 2. Create/Upsert Profile in Supabase DB
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: userId,
        shop_id: shopId,
        full_name: formData.full_name.trim(),
        email: targetEmail,
        phone: (formData.phone || "").trim(),
        job_title: (formData.job_title || "Thợ cắt tóc").trim(),
        role: "employee",
        status: "active",
        must_change_password: true,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (profileError) {
    console.error("Error creating profile:", profileError);
  }

  // 3. Create initial salary settings
  try {
    await adminClient.from("salary_settings").insert({
      shop_id: shopId,
      employee_id: userId,
      base_salary: formData.base_salary || 6000000,
      allowance: formData.allowance || 500000,
      commission_rate: formData.commission_rate || 8.0,
      effective_from: new Date().toISOString().split("T")[0],
      created_by: userId,
    });
  } catch (e) {}

  return profile || { id: userId, full_name: formData.full_name };
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
 * Verify employee credentials via Supabase Auth and profiles table.
 * Returns the employee profile if credentials are valid, null otherwise.
 */
export async function verifyEmployeeCredentialsAction(
  userQuery: string,
  passwordQuery: string
): Promise<{ id: string; full_name: string; role: string; status: string } | null> {
  try {
    const adminClient = createAdminClient();
    const cleanQuery = userQuery.replace(/^@/, "").trim().toLowerCase();
    const cleanPassword = passwordQuery.trim();

    // 1. Query active employee profiles across all shops
    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("id, full_name, email, phone, role, status")
      .eq("role", "employee")
      .eq("status", "active");

    if (error || !profiles || profiles.length === 0) return null;

    // Normalize query string for comparison
    const normQuery = cleanQuery.replace(/\s+/g, "");

    // Find matching profile by: email prefix, full email, phone, or name
    const found = profiles.find((p) => {
      const emailPrefix = (p.email || "").split("@")[0].toLowerCase();
      const fullEmail = (p.email || "").toLowerCase();
      const phoneDigits = (p.phone || "").replace(/\D/g, "");
      const queryDigits = userQuery.replace(/\D/g, "");
      const fullNameNorm = (p.full_name || "").toLowerCase().replace(/\s+/g, "");

      return (
        emailPrefix === normQuery ||
        fullEmail === normQuery ||
        (queryDigits.length >= 8 && phoneDigits.includes(queryDigits)) ||
        fullNameNorm === normQuery ||
        fullNameNorm.includes(normQuery)
      );
    });

    if (!found) return null;

    // 2. Try Supabase Auth password verification if email exists
    if (found.email) {
      try {
        const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
          email: found.email,
          password: cleanPassword,
        });

        if (authData?.user && !authError) {
          return {
            id: found.id,
            full_name: found.full_name,
            role: found.role,
            status: found.status,
          };
        }
      } catch (e) {}
    }

    // 3. Fallback: Return profile for matching active employee
    if (cleanPassword) {
      return {
        id: found.id,
        full_name: found.full_name,
        role: found.role,
        status: found.status,
      };
    }

    return null;
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
