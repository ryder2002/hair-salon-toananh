"use client";

import { createRevenueEntryAction } from "@/server/actions/revenue";
import { getPendingOfflineRevenues, removeOfflineRevenue, markOfflineRevenueFailed } from "./idb";

export async function syncOfflineRevenues() {
  const pending = await getPendingOfflineRevenues();
  for (const entry of pending) {
    if (entry.sync_status !== "pending") continue;
    try {
      await createRevenueEntryAction({
        amount: entry.amount,
        payment_method: entry.payment_method,
        service_name: entry.service_name,
        note: entry.note,
        business_date: entry.business_date,
        idempotency_key: entry.idempotency_key,
      });
      await removeOfflineRevenue(entry.idempotency_key);
    } catch (error) {
      await markOfflineRevenueFailed(entry.idempotency_key, error instanceof Error ? error.message : String(error));
    }
  }
}
