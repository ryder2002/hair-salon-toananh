import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface OfflineRevenueEntry {
  idempotency_key: string;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  service_name?: string;
  note?: string;
  business_date: string;
  performed_at: string;
  created_at: string;
  sync_status: "pending" | "failed";
  error_message?: string;
}

interface BarberShopDBSchema extends DBSchema {
  offline_revenues: {
    key: string;
    value: OfflineRevenueEntry;
  };
}

const DB_NAME = "barbershop_offline_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BarberShopDBSchema>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<BarberShopDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<BarberShopDBSchema>) {
        if (!db.objectStoreNames.contains("offline_revenues")) {
          db.createObjectStore("offline_revenues", { keyPath: "idempotency_key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveOfflineRevenue(entry: OfflineRevenueEntry): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("offline_revenues", entry);
}

export async function getPendingOfflineRevenues(): Promise<OfflineRevenueEntry[]> {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll("offline_revenues");
}

export async function removeOfflineRevenue(idempotency_key: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("offline_revenues", idempotency_key);
}

export async function markOfflineRevenueFailed(idempotency_key: string, error_message: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const entry = await db.get("offline_revenues", idempotency_key);
  if (entry) await db.put("offline_revenues", { ...entry, sync_status: "failed", error_message });
}
