import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rxtsyrebfrdbfupjlqse.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dHN5cmViZnJkYmZ1cGpscXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjUwODgsImV4cCI6MjEwMTAwMTA4OH0.cVQIo5vQPjNvJGiPhwWe91llcvH_b2YB4L57nXNFJbs";

  return createBrowserClient(url, key);
}
