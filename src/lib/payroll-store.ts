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

const DEFAULT_ROWS: StoredPayrollRow[] = [
  {
    id: "p1",
    name: "Minh Tùng",
    isManager: true,
    roleTitle: "Thợ chính",
    baseSalary: "8000000",
    allowance: "1000000",
    commPercent: 10,
    eligibleRevenue: "10490000",
    commAmount: "1049000",
    bonus: "0",
    deduction: "0",
    totalSalary: "10049000",
    status: "published",
    isPaid: false,
  },
  {
    id: "p2",
    name: "Hoàng Nam",
    roleTitle: "Thợ chính",
    baseSalary: "8000000",
    allowance: "800000",
    commPercent: 10,
    eligibleRevenue: "8730000",
    commAmount: "873000",
    bonus: "0",
    deduction: "0",
    totalSalary: "9673000",
    status: "published",
    isPaid: false,
  },
  {
    id: "p3",
    name: "Quang Huy",
    roleTitle: "Thợ phụ",
    baseSalary: "6000000",
    allowance: "500000",
    commPercent: 8,
    eligibleRevenue: "6290000",
    commAmount: "503200",
    bonus: "0",
    deduction: "0",
    totalSalary: "7003200",
    status: "published",
    isPaid: false,
  },
  {
    id: "p4",
    name: "Đức Anh",
    roleTitle: "Thợ phụ",
    baseSalary: "6000000",
    allowance: "500000",
    commPercent: 8,
    eligibleRevenue: "5340000",
    commAmount: "427200",
    bonus: "0",
    deduction: "0",
    totalSalary: "6927200",
    status: "published",
    isPaid: false,
  },
  {
    id: "p5",
    name: "Tuấn Kiệt",
    roleTitle: "Thực tập",
    baseSalary: "4000000",
    allowance: "300000",
    commPercent: 5,
    eligibleRevenue: "4050000",
    commAmount: "202500",
    bonus: "0",
    deduction: "0",
    totalSalary: "4502500",
    status: "published",
    isPaid: false,
  },
];

const PAYROLL_STORAGE_PREFIX = "barbershop_payroll_";

export function getMonthPayroll(month: string): MonthPayrollData {
  const key = `${PAYROLL_STORAGE_PREFIX}${month.replace(/\s+|\//g, "_")}`;
  if (typeof window === "undefined") {
    return {
      month,
      globalStatus: "published",
      updatedAt: new Date().toISOString(),
      rows: DEFAULT_ROWS,
    };
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initialData: MonthPayrollData = {
        month,
        globalStatus: "published",
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
      globalStatus: "published",
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
    } catch (err) {
      console.error("Failed to save payroll data:", err);
    }
  }
}
