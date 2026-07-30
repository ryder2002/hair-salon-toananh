export interface DayClosingState {
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  businessDate: string;
}

const STORAGE_KEY = "barbershop_day_closing_state";
const EVENT_NAME = "barbershop_day_closing_updated";

export function getDayClosingState(): DayClosingState {
  if (typeof window === "undefined") {
    return { isClosed: false, businessDate: new Date().toISOString().split("T")[0] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: DayClosingState = {
        isClosed: false,
        businessDate: new Date().toISOString().split("T")[0],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return { isClosed: false, businessDate: new Date().toISOString().split("T")[0] };
  }
}

export function setDayClosingState(isClosed: boolean, actorName = "Admin Manager"): DayClosingState {
  const now = new Date();
  const newState: DayClosingState = {
    isClosed,
    closedAt: isClosed ? now.toLocaleString("vi-VN") : undefined,
    closedBy: isClosed ? actorName : undefined,
    businessDate: now.toISOString().split("T")[0],
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newState }));
    } catch (err) {
      console.error("Failed to save day closing state:", err);
    }
  }

  return newState;
}

export function subscribeDayClosing(callback: (state: DayClosingState) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvt = event as CustomEvent<DayClosingState>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    } else {
      callback(getDayClosingState());
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
