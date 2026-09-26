import { adminClient, handle, json, requireUser } from "../_shared/http.ts";

// Permanently deletes the caller's account: uploaded files first, then the auth
// user. Every table row references auth.users with ON DELETE CASCADE.
Deno.serve(handle("delete-account", async (req) => {
  const supabase = adminClient();
  const user = await requireUser(req, supabase);

  const bucket = supabase.storage.from("resumes");
  for (;;) {
    const { data: files, error } = await bucket.list(user.id, { limit: 100 });
    if (error) throw new Error("Failed to list files: " + error.message);
    if (!files?.length) break;
    const { error: removeError } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
    if (removeError) throw new Error("Failed to delete files: " + removeError.message);
    if (files.length < 100) break;
  }

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) throw new Error("Failed to delete account: " + error.message);
  return json(req, { deleted: true });
}));
