import { createClient } from "@/lib/supabase/client";

type ChangeCallback = (payload: unknown) => void;
const subscribers = new Set<ChangeCallback>();
let realtimeChannel: any = null;
let initializing = false;

export function initRealtimeSync() {
  if (typeof window === "undefined" || realtimeChannel || initializing) return;
  initializing = true;
  const supabase = createClient();

  let timeout: any = null;
  const dispatch = (payload: any) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      subscribers.forEach((cb) => {
        try { cb(payload); } catch (e) { console.error("Realtime error", e); }
      });
    }, 1500); // Debounce rapidly firing events
  };

  supabase.auth.getSession().then(({ data }) => {
    initializing = false;
    const user = data.session?.user;
    if (!user || realtimeChannel) return;

    realtimeChannel = supabase
      .channel(`app-realtime-sync-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "revenue_entries" },
        (payload) => dispatch(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_closings" },
        (payload) => dispatch(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => dispatch(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payrolls" },
        (payload) => dispatch(payload)
      )
      .on("broadcast", { event: "invalidate" }, (payload) => dispatch(payload))
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
