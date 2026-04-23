import { createClient } from "@supabase/supabase-js";

// Trim because Vercel env vars have shown trailing newlines in production that
// slip through as `%0A` in the realtime WebSocket URL, causing WS upgrades to
// fail and the client to spin in a reconnect loop.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
