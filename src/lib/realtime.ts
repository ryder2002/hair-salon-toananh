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
    void supabase.realtime.setAuth().then(() => {
    realtimeChannel = supabase
      .channel(`private-user-${data.user.id}`, { config: { private: true } })
      .on("broadcast", { event: "invalidate" }, (payload) => {
        subscribers.forEach((callback) => {
          try { callback(payload); } catch (error) { console.error("Realtime callback error", error); }
        });
      })
      .subscribe();
    });
  }).catch(() => { initializing = false; });
}

export function subscribeRealtime(callback: ChangeCallback) {
  subscribers.add(callback);
  initRealtimeSync();
  return () => subscribers.delete(callback);
}
