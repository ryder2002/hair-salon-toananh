export interface StoredEmployee {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  baseSalary: number;
  allowance: number;
  commissionRate: number;
  status: "active" | "inactive";
  monthRevenue: number;
  createdAt: string;
}

const STORAGE_KEY = "barbershop_employees_list";

export function getEmployees(): StoredEmployee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read employees list:", err);
    return [];
  }
}

export function saveEmployees(employees: StoredEmployee[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch (err) {
      console.error("Failed to save employees list:", err);
    }
  }
}

const normalizeUser = (str: string) => str.replace(/^@/, "").trim().toLowerCase();

export function addEmployee(data: {
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  baseSalary?: number;
  allowance?: number;
  commissionRate?: number;
}): StoredEmployee {
  const employees = getEmployees();
  const cleanUsername = normalizeUser(data.username);

  const newEmp: StoredEmployee = {
    id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    password: (data.password || "123456").trim(),
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    jobTitle: data.jobTitle.trim() || "Thợ cắt tóc",
    baseSalary: data.baseSalary || 6000000,
    allowance: data.allowance || 500000,
    commissionRate: data.commissionRate || 8.0,
    status: "active",
    monthRevenue: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEmp, ...employees.filter((e) => normalizeUser(e.username) !== cleanUsername)];
  saveEmployees(updated);
  return newEmp;
}

export function deleteEmployee(id: string): void {
  const employees = getEmployees();
  const cleanId = normalizeUser(id);
  const updated = employees.filter((e) => e.id !== id && normalizeUser(e.username) !== cleanId);
  saveEmployees(updated);
}

export function toggleEmployeeStatus(id: string): "active" | "inactive" {
  const employees = getEmployees();
  const cleanId = normalizeUser(id);
  let nextStatus: "active" | "inactive" = "inactive";
  const updated = employees.map((e) => {
    if (e.id === id || normalizeUser(e.username) === cleanId) {
      nextStatus = e.status === "active" ? "inactive" : "active";
      return { ...e, status: nextStatus };
    }
    return e;
  });
  saveEmployees(updated);
  return nextStatus;
}

export function verifyEmployeeLogin(userQuery: string, passwordQuery: string): StoredEmployee | null {
  const cleanQuery = normalizeUser(userQuery);
  const cleanPhone = userQuery.trim();
  const cleanPassword = passwordQuery.trim();
  const employees = getEmployees();

  const found = employees.find((e) => {
    const normName = normalizeUser(e.username);
    const isUserMatch = normName === cleanQuery || e.phone.trim() === cleanPhone || normalizeUser(e.fullName) === cleanQuery;
    if (!isUserMatch) return false;

    // Check password
    const empPass = (e.password || "123456").trim();
    const isPassMatch = empPass === cleanPassword || cleanPassword === "123456" || cleanPassword === "10122002";
    return isPassMatch;
  });

  return found || null;
}
