"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DBPayrollRow {
  id: string;
  employee_id: string;
  employee_name: string;
  job_title: string;
  is_manager: boolean;
  base_salary: number;
  allowance: number;
  commission_rate: number;
  eligible_revenue: number;
  commission_amount: number;
  bonus: number;
  deduction: number;
  total_salary: number;
  status: "draft" | "locked" | "published" | "paid";
  is_paid: boolean;
}

export interface PayrollMonthSummary {
  monthStr: string;
  payrollMonthDate: string;
  globalStatus: "draft" | "locked" | "published" | "paid";
  totalPayroll: number;
  employeeCount: number;
  updatedAt: string;
}

/**
 * Helper to convert Vietnamese month string ("Tháng 07/2026", "07/2026", "2026-07") to YYYY-MM-01
 */
function parseMonthToDbDate(monthStr: string): string {
  const match = monthStr.match(/(\d{1,2})[^\d]+(\d{4})/) || monthStr.match(/(\d{4})[^\d]+(\d{1,2})/);
  if (match) {
    if (match[1].length === 4) {
      const year = match[1];
      const month = match[2].padStart(2, "0");
      return `${year}-${month}-01`;
    } else {
      const month = match[1].padStart(2, "0");
      const year = match[2];
      return `${year}-${month}-01`;
    }
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Helper to format YYYY-MM-01 back to "Tháng MM/YYYY"
 */
function formatDbDateToMonthStr(dbDate: string): string {
  const parts = dbDate.split("-");
  if (parts.length >= 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return dbDate;
}

/**
 * Fetch payroll data for a given month from Database.
 * If no payroll records exist yet for this month, calculate preview rows based on
 * active profiles, salary_settings, and revenue_entries.
 */
export async function fetchPayrollsAction(payrollMonthStr: string) {
  const dbDate = parseMonthToDbDate(payrollMonthStr);
  const adminClient = createAdminClient();

  // 1. Fetch active employee profiles
  const { data: profiles, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, full_name, job_title, role, status")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (profileErr) {
    console.error("Error fetching profiles for payroll:", profileErr.message);
  }
  const activeProfiles = profiles || [];

  // 2. Fetch salary_settings for active profiles
  const { data: salarySettings } = await adminClient
    .from("salary_settings")
    .select("employee_id, base_salary, allowance, commission_rate");

  const settingsMap = new Map<string, { base_salary: number; allowance: number; commission_rate: number }>();
  if (salarySettings) {
    salarySettings.forEach((s) => {
      settingsMap.set(s.employee_id, {
        base_salary: Number(s.base_salary || 0),
        allowance: Number(s.allowance || 0),
        commission_rate: Number(s.commission_rate || 0),
      });
    });
  }

  // 3. Fetch stored payrolls for dbDate
  const { data: existingPayrolls, error: payrollErr } = await adminClient
    .from("payrolls")
    .select(`
      id,
      employee_id,
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
      paid_at,
      profiles:employee_id!payrolls_employee_id_fkey (full_name, job_title)
    `)
    .eq("payroll_month", dbDate);

  if (payrollErr) {
    console.error("Error fetching stored payrolls:", payrollErr);
  }

  // Calculate start and end date for revenue calculations in this month
  const yearNum = parseInt(dbDate.split("-")[0], 10);
  const monthNum = parseInt(dbDate.split("-")[1], 10);
  const startDateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
  const nextMonthYear = monthNum === 12 ? yearNum + 1 : yearNum;
  const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
  const endDateStr = `${nextMonthYear}-${String(nextMonthNum).padStart(2, "0")}-01`;

  // Fetch recorded revenue entries for this month
  const { data: revenueEntries } = await adminClient
    .from("revenue_entries")
    .select("employee_id, amount")
    .gte("business_date", startDateStr)
    .lt("business_date", endDateStr)
    .eq("status", "recorded");

  const empRevenueMap = new Map<string, number>();
  if (revenueEntries) {
    revenueEntries.forEach((r: any) => {
      const current = empRevenueMap.get(r.employee_id) || 0;
      empRevenueMap.set(r.employee_id, current + Number(r.amount || 0));
    });
  }

  const existingMap = new Map<string, any>();
  if (existingPayrolls) {
    existingPayrolls.forEach((p) => existingMap.set(p.employee_id, p));
  }

  // Determine global status
  let globalStatus: "draft" | "locked" | "published" | "paid" = "draft";
  if (existingPayrolls && existingPayrolls.length > 0) {
    const statuses = existingPayrolls.map((p) => p.status);
    if (statuses.every((s) => s === "paid")) globalStatus = "paid";
    else if (statuses.some((s) => s === "published")) globalStatus = "published";
    else if (statuses.some((s) => s === "locked")) globalStatus = "locked";
    else globalStatus = "draft";
  }

  // Build merged rows
  const rows: DBPayrollRow[] = activeProfiles.map((p) => {
    const existing = existingMap.get(p.id);
    const setting = settingsMap.get(p.id);

    const baseSalary = existing ? Number(existing.base_salary) : (setting?.base_salary ?? 6000000);
    const allowance = existing ? Number(existing.allowance) : (setting?.allowance ?? 500000);
    const commRate = existing ? Number(existing.commission_rate) : (setting?.commission_rate ?? 10);

    const calcRevenue = empRevenueMap.get(p.id) || 0;
    const eligibleRevenue = existing ? Number(existing.eligible_revenue) : calcRevenue;

    const commAmount = existing
      ? Number(existing.commission_amount)
      : Math.round((eligibleRevenue * commRate) / 100);

    const bonus = existing ? Number(existing.bonus) : 0;
    const deduction = existing ? Number(existing.deduction) : 0;
    const totalSalary = existing
      ? Number(existing.total_salary)
      : baseSalary + allowance + commAmount + bonus - deduction;

    const rowStatus = existing ? (existing.status as "draft" | "locked" | "published" | "paid") : globalStatus;
    const isPaid = existing ? existing.status === "paid" || !!existing.paid_at : false;

    return {
      id: existing?.id || `temp_${p.id}`,
      employee_id: p.id,
      employee_name: p.full_name,
      job_title: p.job_title || "Thợ cắt tóc",
      is_manager: (p.job_title || "").toLowerCase().includes("quản lý") || p.role === "admin",
      base_salary: baseSalary,
      allowance: allowance,
      commission_rate: commRate,
      eligible_revenue: eligibleRevenue,
      commission_amount: commAmount,
      bonus,
      deduction,
      total_salary: totalSalary,
      status: rowStatus,
      is_paid: isPaid,
    };
  });

  return {
    monthStr: payrollMonthStr,
    dbDate,
    globalStatus,
    rows,
  };
}

/**
 * Generate monthly payroll in Database for a given month.
 */
export async function generatePayrollAction(payrollMonthStr: string) {
  const dbDate = parseMonthToDbDate(payrollMonthStr);
  const adminClient = createAdminClient();

  // Try RPC first
  const { error: rpcErr } = await adminClient.rpc("generate_monthly_payroll", {
    p_payroll_month: dbDate,
  });

  if (!rpcErr) {
    return { success: true };
  }

  // Fallback: manual generation via Node server action
  const shopId = "11111111-1111-1111-1111-111111111111";

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id")
    .eq("status", "active");

  if (!profiles) return { success: true };

  const { data: settings } = await adminClient
    .from("salary_settings")
    .select("employee_id, base_salary, allowance, commission_rate");

  const settingsMap = new Map<string, any>();
  if (settings) {
    settings.forEach((s) => settingsMap.set(s.employee_id, s));
  }

  const yearNum = parseInt(dbDate.split("-")[0], 10);
  const monthNum = parseInt(dbDate.split("-")[1], 10);
  const startDateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
  const nextMonthYear = monthNum === 12 ? yearNum + 1 : yearNum;
  const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
  const endDateStr = `${nextMonthYear}-${String(nextMonthNum).padStart(2, "0")}-01`;

  const { data: revenueEntries } = await adminClient
    .from("revenue_entries")
    .select("employee_id, amount")
    .gte("business_date", startDateStr)
    .lt("business_date", endDateStr)
    .eq("status", "recorded");

  const empRevenueMap = new Map<string, number>();
  if (revenueEntries) {
    revenueEntries.forEach((r) => {
      const curr = empRevenueMap.get(r.employee_id) || 0;
      empRevenueMap.set(r.employee_id, curr + Number(r.amount || 0));
    });
  }

  for (const prof of profiles) {
    const s = settingsMap.get(prof.id);
    const baseSalary = Number(s?.base_salary ?? 6000000);
    const allowance = Number(s?.allowance ?? 500000);
    const commRate = Number(s?.commission_rate ?? 10);

    const eligibleRev = empRevenueMap.get(prof.id) || 0;
    const commAmount = Math.round((eligibleRev * commRate) / 100);
    const totalSalary = baseSalary + allowance + commAmount;

    await adminClient.from("payrolls").upsert(
      {
        shop_id: shopId,
        employee_id: prof.id,
        payroll_month: dbDate,
        base_salary: baseSalary,
        allowance: allowance,
        eligible_revenue: eligibleRev,
        commission_rate: commRate,
        commission_amount: commAmount,
        total_salary: totalSalary,
        status: "draft",
        generated_by: prof.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shop_id,employee_id,payroll_month" }
    );
  }

  return { success: true };
}

/**
 * Update payroll status for a given month in Database.
 */
export async function updatePayrollStatusAction(
  payrollMonthStr: string,
  status: "draft" | "locked" | "published" | "paid"
) {
  const dbDate = parseMonthToDbDate(payrollMonthStr);
  const adminClient = createAdminClient();

  // First generate/upsert if rows don't exist
  await generatePayrollAction(payrollMonthStr);

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "published") {
    updateData.published_at = new Date().toISOString();
  } else if (status === "paid") {
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await adminClient
    .from("payrolls")
    .update(updateData)
    .eq("payroll_month", dbDate)
    .select();

  if (error) {
    console.error("Error updating payroll status:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Toggle or update single employee payroll paid status in Database.
 */
export async function updateSinglePayrollPaidAction(
  payrollMonthStr: string,
  employeeId: string,
  isPaid: boolean
) {
  const dbDate = parseMonthToDbDate(payrollMonthStr);
  const adminClient = createAdminClient();

  // Ensure payroll exists first
  await generatePayrollAction(payrollMonthStr);

  const status = isPaid ? "paid" : "published";

  const { data, error } = await adminClient
    .from("payrolls")
    .update({
      status,
      paid_at: isPaid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("payroll_month", dbDate)
    .eq("employee_id", employeeId)
    .select();

  if (error) {
    console.error("Error updating single employee payroll:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Save salary settings for employees in Database.
 */
export async function updateSalarySettingsAction(
  settings: Array<{
    employee_id: string;
    base_salary: number;
    allowance: number;
    commission_rate: number;
  }>
) {
  const adminClient = createAdminClient();
  const shopId = "11111111-1111-1111-1111-111111111111";

  for (const item of settings) {
    const { data: existing } = await adminClient
      .from("salary_settings")
      .select("id")
      .eq("employee_id", item.employee_id)
      .maybeSingle();

    if (existing) {
      await adminClient
        .from("salary_settings")
        .update({
          base_salary: item.base_salary,
          allowance: item.allowance,
          commission_rate: item.commission_rate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await adminClient.from("salary_settings").insert({
        shop_id: shopId,
        employee_id: item.employee_id,
        base_salary: item.base_salary,
        allowance: item.allowance,
        commission_rate: item.commission_rate,
        effective_from: new Date().toISOString().split("T")[0],
        created_by: item.employee_id,
      });
    }
  }

  return { success: true };
}

/**
 * Fetch past payroll month summaries from Database for History section.
 */
export async function fetchPayrollHistoryAction(): Promise<PayrollMonthSummary[]> {
  const adminClient = createAdminClient();
  const { data: payrolls, error } = await adminClient
    .from("payrolls")
    .select("payroll_month, total_salary, status, updated_at")
    .order("payroll_month", { ascending: false });

  if (error || !payrolls || payrolls.length === 0) {
    return [];
  }

  const map = new Map<string, { total: number; count: number; status: "draft" | "locked" | "published" | "paid"; updatedAt: string }>();

  payrolls.forEach((p) => {
    const monthKey = p.payroll_month;
    const current = map.get(monthKey) || {
      total: 0,
      count: 0,
      status: p.status as any,
      updatedAt: p.updated_at,
    };
    current.total += Number(p.total_salary || 0);
    current.count += 1;
    if (p.status === "paid") current.status = "paid";
    else if (p.status === "published" && current.status !== "paid") current.status = "published";
    map.set(monthKey, current);
  });

  const result: PayrollMonthSummary[] = [];
  map.forEach((val, key) => {
    result.push({
      monthStr: formatDbDateToMonthStr(key),
      payrollMonthDate: key,
      globalStatus: val.status,
      totalPayroll: val.total,
      employeeCount: val.count,
      updatedAt: val.updatedAt,
    });
  });

  return result;
}

/**
 * Fetch payroll slip for logged-in employee for employee portal.
 */
export async function fetchMyPayrollSlipAction(payrollMonthStr: string, employeeId?: string) {
  const dbDate = parseMonthToDbDate(payrollMonthStr);
  const adminClient = createAdminClient();

  let targetEmpId = employeeId;
  if (!targetEmpId) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "employee")
      .limit(1);
    targetEmpId = profiles?.[0]?.id;
  }

  if (!targetEmpId) return null;

  const { data: payroll, error } = await adminClient
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
      paid_at,
      profiles:employee_id!payrolls_employee_id_fkey (full_name, job_title)
    `)
    .eq("payroll_month", dbDate)
    .eq("employee_id", targetEmpId)
    .maybeSingle();

  if (error || !payroll) {
    return null;
  }

  return {
    id: payroll.id,
    monthStr: payrollMonthStr,
    name: (payroll.profiles as any)?.full_name || "Nhân viên",
    roleTitle: (payroll.profiles as any)?.job_title || "Thợ cắt tóc",
    baseSalary: String(payroll.base_salary),
    allowance: String(payroll.allowance),
    commPercent: Number(payroll.commission_rate),
    eligibleRevenue: String(payroll.eligible_revenue),
    commAmount: String(payroll.commission_amount),
    bonus: String(payroll.bonus || 0),
    deduction: String(payroll.deduction || 0),
    totalSalary: String(payroll.total_salary),
    status: payroll.status,
    isPaid: payroll.status === "paid" || !!payroll.paid_at,
  };
}

