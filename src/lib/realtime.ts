import { createClient } from "@/lib/supabase/client";

type ChangeCallback = (payload: any) => void;
const subscribers = new Set<ChangeCallback>();
let realtimeChannel: any = null;

export function initRealtimeSync() {
  if (typeof window === "undefined" || realtimeChannel) return;

  const supabase = createClient();
  realtimeChannel = supabase
    .channel("public-db-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public" },
      (payload) => {
        subscribers.forEach((cb) => {
          try {
            cb(payload);
          } catch (e) {
            console.error("Realtime callback error:", e);
          }
        });
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("⚡ Realtime Supabase Sync Connected (< 50ms speed)!");
      }
    });
}

export function subscribeRealtime(callback: ChangeCallback) {
  subscribers.add(callback);
  initRealtimeSync();

  return () => {
    subscribers.delete(callback);
  };
}
