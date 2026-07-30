export interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  actorRole?: string;
  details: string;
  timestamp: string;
}

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "a1",
    action: "REVENUE_VOIDED",
    actorName: "Admin Manager",
    actorRole: "admin",
    details: "Đã hủy giao dịch 300.000 đ của Hoàng Long (Lý do: Thao tác nhầm)",
    timestamp: "22/05/2025 17:32",
  },
  {
    id: "a2",
    action: "PAYROLL_PUBLISHED",
    actorName: "Admin Manager",
    actorRole: "admin",
    details: "Đã công bố bảng lương kỳ Tháng 5/2024 cho toàn bộ nhân viên",
    timestamp: "20/05/2024 20:30",
  },
  {
    id: "a3",
    action: "DAY_CLOSED",
    actorName: "Admin Manager",
    actorRole: "admin",
    details: "Đã chốt ngày 21/05/2025 (Tổng doanh thu: 12.560.000 đ)",
    timestamp: "21/05/2025 21:10",
  },
  {
    id: "a4",
    action: "STAFF_CREATED",
    actorName: "Admin Manager",
    actorRole: "admin",
    details: "Đã tạo tài khoản nhân viên mới cho Bảo Nam (Chức vụ: Thợ cắt tóc)",
    timestamp: "18/05/2025 18:45",
  },
];

const STORAGE_KEY = "barbershop_audit_logs";

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return DEFAULT_AUDIT_LOGS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return DEFAULT_AUDIT_LOGS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read audit logs from storage:", err);
    return DEFAULT_AUDIT_LOGS;
  }
}

export function addAuditLog(entry: {
  action: string;
  actorName: string;
  actorRole?: string;
  details: string;
}): AuditLogEntry {
  const logs = getAuditLogs();
  const now = new Date();
  const formattedTime = `${now.toLocaleDateString("vi-VN")} ${now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action: entry.action,
    actorName: entry.actorName,
    actorRole: entry.actorRole || "admin",
    details: entry.details,
    timestamp: formattedTime,
  };

  const updatedLogs = [newLog, ...logs];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    } catch (err) {
      console.error("Failed to save audit log:", err);
    }
  }
  return newLog;
}
