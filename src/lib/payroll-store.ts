export interface StoredPayrollRow {
  id: string;
  name: string;
  isManager?: boolean;
  roleTitle: string;
  baseSalary: string; // string serialized for BigInt
  allowance: string;
  commPercent: number;
  eligibleRevenue: string;
  commAmount: string;
  bonus: string;
  deduction: string;
  totalSalary: string;
  status: "draft" | "locked" | "published" | "paid";
  isPaid?: boolean;
}

export interface MonthPayrollData {
  month: string;
  globalStatus: "draft" | "locked" | "published" | "paid";
  updatedAt: string;
  rows: StoredPayrollRow[];
}

const DEFAULT_ROWS: StoredPayrollRow[] = [];

const PAYROLL_STORAGE_PREFIX = "barbershop_payroll_";

const PAYROLL_EVENT_NAME = "barbershop_payroll_updated";

export function getMonthPayroll(month: string): MonthPayrollData {
  const key = `${PAYROLL_STORAGE_PREFIX}${month.replace(/\s+|\//g, "_")}`;
  if (typeof window === "undefined") {
    return {
      month,
      globalStatus: "draft",
      updatedAt: new Date().toISOString(),
      rows: DEFAULT_ROWS,
    };
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initialData: MonthPayrollData = {
        month,
        globalStatus: "draft",
        updatedAt: new Date().toISOString(),
        rows: DEFAULT_ROWS,
      };
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(raw);
  } catch {
    return {
      month,
      globalStatus: "draft",
      updatedAt: new Date().toISOString(),
      rows: DEFAULT_ROWS,
    };
  }
}

export function saveMonthPayroll(data: MonthPayrollData): void {
  const key = `${PAYROLL_STORAGE_PREFIX}${data.month.replace(/\s+|\//g, "_")}`;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(PAYROLL_EVENT_NAME, { detail: data }));
    } catch (err) {
      console.error("Failed to save payroll data:", err);
    }
  }
}

export function subscribePayroll(callback: (data: MonthPayrollData) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvt = event as CustomEvent<MonthPayrollData>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    }
  };

  window.addEventListener(PAYROLL_EVENT_NAME, handler);
  return () => window.removeEventListener(PAYROLL_EVENT_NAME, handler);
}
