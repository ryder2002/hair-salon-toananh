import { addNotification } from "@/lib/notification-store";
import { addAuditLog } from "@/lib/audit-log";
import { formatVND } from "@/lib/money";

export interface StoredTransaction {
  id: string;
  staffName: string;
  username?: string;
  avatarType?: "scissors" | "mustache" | "comb" | "pole";
  serviceName: string;
  amount: string; // serialized BigInt/number
  paymentMethod: "cash" | "bank_transfer";
  time: string;
  timestamp: number;
  status: "recorded" | "voided";
}

const STORAGE_KEY = "barbershop_revenue_transactions";
const LAST_SUBMIT_KEY = "barbershop_last_revenue_submit_time";
const EVENT_NAME = "barbershop_revenue_updated";

export function getRevenueTransactions(): StoredTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read revenue transactions:", err);
    return [];
  }
}

export function saveRevenueTransactions(transactions: StoredTransaction[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: transactions }));
    } catch (err) {
      console.error("Failed to save transactions:", err);
    }
  }
}

export function addRevenueTransaction(data: {
  staffName: string;
  username?: string;
  avatarType?: "scissors" | "mustache" | "comb" | "pole";
  serviceName: string;
  amount: number | bigint;
  paymentMethod: "cash" | "bank_transfer";
}): { success: boolean; error?: string; transaction?: StoredTransaction } {
  if (typeof window !== "undefined") {
    // 1. Anti-Spam Rate Limit Check (Minimum 3 seconds cooldown)
    const nowMs = Date.now();
    const lastSubmitMs = parseInt(localStorage.getItem(LAST_SUBMIT_KEY) || "0", 10);

    if (nowMs - lastSubmitMs < 3000) {
      return {
        success: false,
        error: "Thao tác quá nhanh! Vui lòng đợi vài giây trước khi gửi tiếp đơn mới để tránh trùng đơn.",
      };
    }
    localStorage.setItem(LAST_SUBMIT_KEY, String(nowMs));
  }

  const transactions = getRevenueTransactions();
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  const newTx: StoredTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    staffName: data.staffName.trim(),
    username: data.username,
    avatarType: data.avatarType || "scissors",
    serviceName: data.serviceName.trim(),
    amount: String(data.amount),
    paymentMethod: data.paymentMethod,
    time: timeStr,
    timestamp: Date.now(),
    status: "recorded",
  };

  const updated = [newTx, ...transactions];
  saveRevenueTransactions(updated);

  // 2. Dispatch real-time Admin Notification & Audit Log
  const amountStr = formatVND(data.amount);
  addNotification({
    title: "Nhân viên ghi nhận doanh thu mới",
    message: `${data.staffName} vừa tạo đơn "${data.serviceName}" (${amountStr}) vào ${timeStr}`,
    type: "revenue",
    url: "/admin/revenue",
  });

  addAuditLog({
    action: "REVENUE_RECORDED",
    actorName: data.staffName,
    actorRole: "employee",
    details: `Ghi nhận đơn hàng mới: ${data.serviceName} - ${amountStr} (${data.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}) lúc ${timeStr}`,
  });

  return { success: true, transaction: newTx };
}

export function voidRevenueTransaction(id: string): void {
  const transactions = getRevenueTransactions();
  const updated = transactions.map((t) => (t.id === id ? { ...t, status: "voided" as const } : t));
  saveRevenueTransactions(updated);
}

export function subscribeRevenueTransactions(callback: (txs: StoredTransaction[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvt = event as CustomEvent<StoredTransaction[]>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    } else {
      callback(getRevenueTransactions());
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
