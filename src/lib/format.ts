import { getJobRoleById } from "@/lib/job-roles";

export function formatRole(roleId: string): string {
  return getJobRoleById(roleId)?.name ?? roleId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function gradeColor(grade: string): string {
  if (grade === "A") return "text-accent";
  if (grade === "B") return "text-primary";
  if (grade === "C") return "text-secondary";
  if (grade === "D") return "text-orange-500";
  return "text-destructive";
}

export function formatDate(iso: string, withTime = false): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Extracts a readable message from a supabase.functions.invoke() result. */
export async function functionError(error: unknown, data: unknown): Promise<string | null> {
  const fromData = (data as { error?: unknown } | null)?.error;
  if (typeof fromData === "string") return fromData;
  if (!error) return null;
  const context = (error as { context?: Response }).context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.clone().json();
      if (typeof body?.error === "string") return body.error;
    } catch { /* not JSON */ }
  }
  return error instanceof Error ? error.message : String(error);
}
