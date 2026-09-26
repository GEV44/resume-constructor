// HTTP, auth and rate-limit helpers shared by every edge function (Deno only).
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.95.3";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "*").split(",").map((o) => o.trim()).filter(Boolean);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.includes("*") ? "*" : ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    Vary: "Origin",
  };
}

/** An error that maps to a specific HTTP status and a user-safe message. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(req: Request, supabase: SupabaseClient): Promise<User> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Not authenticated");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new HttpError(401, "Not authenticated");
  return user;
}

/**
 * Per-user hourly quota based on rows the user created in `table` in the last
 * hour. Protects the AI budget from runaway clients without extra infrastructure.
 */
export async function enforceHourlyLimit(supabase: SupabaseClient, table: string, userId: string, envName: string, fallback: number): Promise<void> {
  const limit = Number(Deno.env.get(envName) ?? fallback);
  if (!Number.isFinite(limit) || limit <= 0) return;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  if (error) {
    console.error(`rate-limit lookup on ${table} failed:`, error.message);
    return;
  }
  if ((count ?? 0) >= limit) throw new HttpError(429, `Hourly limit reached (${limit}). Please try again later.`);
}

/** Wraps a handler with CORS preflight, method checks and uniform error responses. */
export function handle(name: string, handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
    if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
    try {
      return await handler(req);
    } catch (e) {
      if (e instanceof HttpError) return json(req, { error: e.message }, e.status);
      console.error(`${name} error:`, e);
      return json(req, { error: "Something went wrong. Please try again." }, 500);
    }
  };
}

/** True for PostgREST errors caused by a column that doesn't exist (e.g. a pending migration). */
export function isMissingColumn(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST204" || error.code === "42703" || /column .* does not exist|Could not find the .* column/i.test(error.message ?? "");
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}
