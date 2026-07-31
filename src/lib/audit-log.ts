export interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  actorRole?: string;
  details: string;
  timestamp: string;
}

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [];

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
