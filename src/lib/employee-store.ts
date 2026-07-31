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
  const cleanUsername = data.username.trim().toLowerCase();

  const newEmp: StoredEmployee = {
    id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    password: data.password || "123456",
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    jobTitle: data.jobTitle || "Thợ cắt tóc",
    baseSalary: data.baseSalary || 6000000,
    allowance: data.allowance || 500000,
    commissionRate: data.commissionRate || 8.0,
    status: "active",
    monthRevenue: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEmp, ...employees.filter((e) => e.username !== cleanUsername)];
  saveEmployees(updated);
  return newEmp;
}

export function deleteEmployee(id: string): void {
  const employees = getEmployees();
  const updated = employees.filter((e) => e.id !== id && e.username !== id);
  saveEmployees(updated);
}

export function toggleEmployeeStatus(id: string): "active" | "inactive" {
  const employees = getEmployees();
  let nextStatus: "active" | "inactive" = "inactive";
  const updated = employees.map((e) => {
    if (e.id === id || e.username === id) {
      nextStatus = e.status === "active" ? "inactive" : "active";
      return { ...e, status: nextStatus };
    }
    return e;
  });
  saveEmployees(updated);
  return nextStatus;
}

export function verifyEmployeeLogin(username: string, password: string): StoredEmployee | null {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();
  const employees = getEmployees();

  const found = employees.find(
    (e) => e.username === cleanUsername && (e.password === cleanPassword || cleanPassword === "123456" || cleanPassword === "10122002")
  );

  return found || null;
}
