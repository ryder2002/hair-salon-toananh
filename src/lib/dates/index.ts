import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Returns current business date string in YYYY-MM-DD format according to Asia/Ho_Chi_Minh timezone
 */
export function getVietnamBusinessDate(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  return formatter.format(date); // Output format: YYYY-MM-DD
}

/**
 * Formats date into Vietnamese date display (e.g. "Thứ Năm, 22/05/2025")
 */
export function formatBusinessDateDisplay(dateStr: string | Date): string {
  const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const formatted = format(dateObj, "EEEE, dd/MM/yyyy", { locale: vi });
  // Capitalize first letter of weekday
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Formats time string (e.g. "09:35")
 */
export function formatTimeDisplay(dateStr: string | Date): string {
  const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return format(dateObj, "HH:mm");
}
