import { createClient } from "@/lib/supabase/client";

type ChangeCallback = (payload: unknown) => void;
const subscribers = new Set<ChangeCallback>();
let realtimeChannel: any = null;
let initializing = false;

export function initRealtimeSync() {
  if (typeof window === "undefined" || realtimeChannel || initializing) return;
  initializing = true;
  const supabase = createClient();

  supabase.auth.getUser().then(({ data }) => {
    initializing = false;
    if (!data.user || realtimeChannel) return;

    realtimeChannel = supabase
      .channel(`app-realtime-sync-${data.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "revenue_entries" },
        (payload) => {
          subscribers.forEach((cb) => {
            try { cb(payload); } catch (e) { console.error("Realtime error", e); }
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_closings" },
        (payload) => {
          subscribers.forEach((cb) => {
            try { cb(payload); } catch (e) { console.error("Realtime error", e); }
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          subscribers.forEach((cb) => {
            try { cb(payload); } catch (e) { console.error("Realtime error", e); }
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payrolls" },
        (payload) => {
          subscribers.forEach((cb) => {
            try { cb(payload); } catch (e) { console.error("Realtime error", e); }
          });
        }
      )
      .on("broadcast", { event: "invalidate" }, (payload) => {
        subscribers.forEach((cb) => {
          try { cb(payload); } catch (e) { console.error("Realtime error", e); }
        });
      })
      .subscribe((status) => {
        console.log("[REALTIME] WebSocket subscription status:", status);
      });
  }).catch(() => {
    initializing = false;
  });
}

export function subscribeRealtime(callback: ChangeCallback) {
  subscribers.add(callback);
  initRealtimeSync();
  return () => subscribers.delete(callback);
}
