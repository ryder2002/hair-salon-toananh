"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function fetchPayrollsAction(payrollMonth: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payrolls")
    .select(`
      id,
      payroll_month,
      base_salary,
      allowance,
      eligible_revenue,
      commission_rate,
      commission_amount,
      bonus,
      deduction,
      total_salary,
      status,
      profiles:employee_id (full_name, job_title, avatar_url)
    `)
    .eq("payroll_month", payrollMonth);

  if (error) {
    console.error("Error fetching payrolls:", error);
    return [];
  }
  return data;
}

export async function generatePayrollAction(payrollMonth: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("generate_monthly_payroll", {
    p_payroll_month: payrollMonth,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePayrollStatusAction(payrollMonth: string, status: "locked" | "published" | "paid") {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payrolls")
    .update({
      status,
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
      ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("payroll_month", payrollMonth)
    .select();

  if (error) throw new Error(error.message);
  return data;
}
