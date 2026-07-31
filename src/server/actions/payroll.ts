"use server";

import { requireActiveProfile, requireAdmin } from "@/lib/supabase/authz";
import { sendWebPushNotificationToUsersAction } from "@/server/actions/push";

export interface DBPayrollRow {
  id: string; employee_id: string; employee_name: string; job_title: string; is_manager: boolean;
  base_salary: number; allowance: number; commission_rate: number; eligible_revenue: number;
  commission_amount: number; bonus: number; deduction: number; total_salary: number;
  status: "draft" | "locked" | "published" | "paid"; is_paid: boolean;
}
export interface PayrollMonthSummary {
  monthStr: string; payrollMonthDate: string; globalStatus: "draft" | "locked" | "published" | "paid";
  totalPayroll: number; employeeCount: number; updatedAt: string;
}

function parseMonthToDbDate(monthStr: string) {
  const match = monthStr.match(/(\d{1,2})[^\d]+(\d{4})/) || monthStr.match(/(\d{4})[^\d]+(\d{1,2})/);
  if (!match) return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  return match[1].length === 4 ? `${match[1]}-${match[2].padStart(2, "0")}-01` : `${match[2]}-${match[1].padStart(2, "0")}-01`;
}
function formatDbDateToMonthStr(date: string) { const [year, month] = date.split("-"); return `Tháng ${month}/${year}`; }

export async function fetchPayrollsAction(payrollMonthStr: string) {
  const { profile, supabase } = await requireAdmin();
  const dbDate = parseMonthToDbDate(payrollMonthStr);
  const start = dbDate;
  const [year, month] = dbDate.split("-").map(Number);
  const end = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01`;

  const [{ data: profiles, error: profileError }, { data: settings }, { data: payrolls, error: payrollError }, { data: revenues }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, job_title, role, status, created_at").eq("shop_id", profile.shop_id).eq("role", "employee").eq("status", "active").order("created_at", { ascending: true }),
    supabase.from("salary_settings").select("employee_id, base_salary, allowance, commission_rate, effective_from, effective_to").eq("shop_id", profile.shop_id),
    supabase.from("payrolls").select("id, employee_id, payroll_month, base_salary, allowance, eligible_revenue, commission_rate, commission_amount, bonus, deduction, total_salary, status, paid_at, profiles:employee_id(full_name, job_title)").eq("shop_id", profile.shop_id).eq("payroll_month", dbDate),
    supabase.from("revenue_entries").select("employee_id, amount").eq("shop_id", profile.shop_id).gte("business_date", start).lt("business_date", end).eq("status", "recorded"),
  ]);
  if (profileError || payrollError) throw new Error(profileError?.message || payrollError?.message || "Unable to load payroll");
  const settingMap = new Map((settings || []).map((s: any) => [s.employee_id, s]));
  const revenueMap = new Map<string, number>();
  (revenues || []).forEach((row: any) => revenueMap.set(row.employee_id, (revenueMap.get(row.employee_id) || 0) + Number(row.amount || 0)));
  const existingMap = new Map((payrolls || []).map((row: any) => [row.employee_id, row]));
  const statuses = (payrolls || []).map((row: any) => row.status);
  const globalStatus = statuses.length && statuses.every((s: string) => s === "paid") ? "paid" : statuses.includes("published") ? "published" : statuses.includes("locked") ? "locked" : "draft";

  const rows: DBPayrollRow[] = (profiles || []).map((employee: any) => {
    const existing: any = existingMap.get(employee.id);
    const setting: any = settingMap.get(employee.id);
    const base = Number(existing?.base_salary ?? setting?.base_salary ?? 0);
    const allowance = Number(existing?.allowance ?? setting?.allowance ?? 0);
    const rate = Number(existing?.commission_rate ?? setting?.commission_rate ?? 0);
    const revenue = Number(existing?.eligible_revenue ?? revenueMap.get(employee.id) ?? 0);
    const commission = Number(existing?.commission_amount ?? Math.round(revenue * rate / 100));
    const bonus = Number(existing?.bonus || 0);
    const deduction = Number(existing?.deduction || 0);
    return {
      id: existing?.id || `preview_${employee.id}`, employee_id: employee.id, employee_name: employee.full_name,
      job_title: employee.job_title || "Thợ cắt tóc", is_manager: false, base_salary: base, allowance,
      commission_rate: rate, eligible_revenue: revenue, commission_amount: commission, bonus, deduction,
      total_salary: Number(existing?.total_salary ?? base + allowance + commission + bonus - deduction),
      status: existing?.status || globalStatus, is_paid: existing?.status === "paid" || !!existing?.paid_at,
    };
  });
  return { monthStr: payrollMonthStr, dbDate, globalStatus, rows };
}

export async function generatePayrollAction(payrollMonthStr: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("generate_monthly_payroll", { p_payroll_month: parseMonthToDbDate(payrollMonthStr) });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updatePayrollStatusAction(payrollMonthStr: string, status: "draft" | "locked" | "published" | "paid") {
  if (status === "draft") throw new Error("Payroll cannot be reverted to draft");
  const { supabase, profile } = await requireAdmin();
  const month = parseMonthToDbDate(payrollMonthStr);
  if (status === "locked") await generatePayrollAction(payrollMonthStr);
  const rpc = status === "locked" ? "lock_payroll" : status === "published" ? "publish_payroll" : "mark_payroll_paid";
  const { data, error } = await supabase.rpc(rpc, { p_payroll_month: month, ...(status === "paid" ? { p_employee_id: null } : {}) });
  if (error) throw new Error(error.message);
  if (status === "published") {
    const { data: publishedRows } = await supabase.from("payrolls").select("employee_id").eq("shop_id", profile.shop_id).eq("payroll_month", month).eq("status", "published");
    const employeeIds = (publishedRows || []).map((row: any) => row.employee_id).filter(Boolean);
    if (employeeIds.length) {
      try {
        await sendWebPushNotificationToUsersAction(employeeIds, "Bảng lương đã được công bố", `Bảng lương ${payrollMonthStr} đã được công bố.`, "/employee/payroll");
      } catch (pushError) {
        console.warn("Payroll published but Web Push delivery failed", pushError);
      }
    }
  }
  return data;
}

export async function updateSinglePayrollPaidAction(payrollMonthStr: string, employeeId: string, isPaid: boolean) {
  if (!isPaid) throw new Error("Paid payroll cannot be reverted");
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("mark_payroll_paid", { p_payroll_month: parseMonthToDbDate(payrollMonthStr), p_employee_id: employeeId });
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSalarySettingsAction(settings: Array<{ employee_id: string; base_salary: number; allowance: number; commission_rate: number }>) {
  const { profile, supabase } = await requireAdmin();
  for (const item of settings) {
    if (!Number.isInteger(item.base_salary) || item.base_salary < 0 || !Number.isInteger(item.allowance) || item.allowance < 0 || item.commission_rate < 0 || item.commission_rate > 100) throw new Error("Invalid salary settings");
    const { error } = await supabase.from("salary_settings").upsert({ shop_id: profile.shop_id, employee_id: item.employee_id, base_salary: item.base_salary, allowance: item.allowance, commission_rate: item.commission_rate, effective_from: new Date().toISOString().slice(0, 10), created_by: profile.id, updated_at: new Date().toISOString() }, { onConflict: "shop_id,employee_id,effective_from" });
    if (error) throw new Error(error.message);
  }
  return { success: true };
}

export async function fetchPayrollHistoryAction(): Promise<PayrollMonthSummary[]> {
  const { profile, supabase } = await requireAdmin();
  const { data, error } = await supabase.from("payrolls").select("payroll_month, total_salary, status, updated_at").eq("shop_id", profile.shop_id).order("payroll_month", { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);
  const map = new Map<string, { total: number; count: number; status: any; updatedAt: string }>();
  (data || []).forEach((row: any) => {
    const current = map.get(row.payroll_month) || { total: 0, count: 0, status: "draft", updatedAt: row.updated_at };
    current.total += Number(row.total_salary || 0); current.count += 1; current.updatedAt = row.updated_at;
    if (row.status === "paid" || (row.status === "published" && current.status !== "paid") || (row.status === "locked" && current.status === "draft")) current.status = row.status;
    map.set(row.payroll_month, current);
  });
  return [...map.entries()].map(([date, value]) => ({ monthStr: formatDbDateToMonthStr(date), payrollMonthDate: date, globalStatus: value.status, totalPayroll: value.total, employeeCount: value.count, updatedAt: value.updatedAt }));
}

export async function fetchMyPayrollSlipAction(payrollMonthStr: string, _ignoredEmployeeId?: string) {
  const { profile, supabase } = await requireActiveProfile();
  const { data, error } = await supabase.from("payrolls").select("id, payroll_month, base_salary, allowance, eligible_revenue, commission_rate, commission_amount, bonus, deduction, total_salary, status, paid_at, profiles:employee_id(full_name, job_title)").eq("shop_id", profile.shop_id).eq("employee_id", profile.id).eq("payroll_month", parseMonthToDbDate(payrollMonthStr)).in("status", ["published", "paid"]).maybeSingle();
  if (error || !data) return null;
  const row: any = data;
  return { id: row.id, monthStr: payrollMonthStr, name: row.profiles?.full_name || profile.full_name, roleTitle: row.profiles?.job_title || "Thợ cắt tóc", baseSalary: String(row.base_salary), allowance: String(row.allowance), commPercent: Number(row.commission_rate), eligibleRevenue: String(row.eligible_revenue), commAmount: String(row.commission_amount), bonus: String(row.bonus || 0), deduction: String(row.deduction || 0), totalSalary: String(row.total_salary), status: row.status, isPaid: row.status === "paid" || !!row.paid_at };
}
