import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Seo from "@/components/Seo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { functionError } from "@/lib/format";
import { AlertTriangle, Download, Loader2, Trash2 } from "lucide-react";

const inputClass =
  "w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
const disabledInputClass =
  "w-full glass rounded-xl px-4 py-3 bg-transparent text-muted-foreground opacity-60 cursor-not-allowed";
const labelClass = "text-sm text-muted-foreground mb-1 block";

function todayStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  // `null` means "not edited yet" — the field then mirrors profile.name, so a
  // profile that loads after mount still populates the input, while in-progress
  // edits are never overwritten.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? profile?.name ?? "";
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to update name."); return; }
    await refreshProfile();
    setNameDraft(null);
    toast.success("Name updated!");
  };

  const changePassword = async () => {
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated!");
  };

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profileRes, resumesRes, analysesRes, optimizedRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("resumes")
          .select("id, file_name, created_at, original_text, parsed_json")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase.from("analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("optimized_resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);
      const failed = [profileRes, resumesRes, analysesRes, optimizedRes].find((r) => r.error);
      if (failed?.error) throw failed.error;

      const payload = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email ?? null },
        profile: profileRes.data,
        resumes: resumesRes.data ?? [],
        analyses: analysesRes.data ?? [],
        optimized_resumes: optimizedRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-builder-export-${todayStamp()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success("Your data export has been downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? `Export failed: ${err.message}` : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
    const message = await functionError(error, data);
    if (message) {
      setDeleting(false);
      toast.error(message);
      return;
    }
    toast.success("Your account has been deleted.");
    setDeleting(false);
    setDeleteOpen(false);
    // Leave the protected route first so ProtectedRoute doesn't bounce us to /login
    // when the session is cleared.
    navigate("/", { replace: true });
    await signOut();
  };

  return (
    <DashboardLayout>
      <Seo title="Profile Settings — AI Resume Builder" description="Update your account name, view your role, and change your password." path="/dashboard/profile" />
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2">Profile Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account details.</p>

        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-heading font-bold mb-4">Account Info</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-email" className={labelClass}>Email</label>
              <input
                id="profile-email"
                type="email"
                value={user?.email || ""}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-name" className={labelClass}>Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setNameDraft(e.target.value)}
                autoComplete="name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-role" className={labelClass}>Role</label>
              <input
                id="profile-role"
                type="text"
                value={profile?.role || "candidate"}
                disabled
                className={`${disabledInputClass} capitalize`}
              />
            </div>
            <button onClick={saveName} disabled={saving} className="btn-primary !text-sm disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-heading font-bold mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-new-password" className={labelClass}>New Password</label>
              <input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                autoComplete="new-password"
                minLength={8}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-confirm-password" className={labelClass}>Confirm New Password</label>
              <input
                id="profile-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                minLength={8}
                className={inputClass}
              />
            </div>
            <button onClick={changePassword} disabled={changingPassword} className="btn-primary !text-sm disabled:opacity-50 flex items-center gap-2">
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-heading font-bold mb-2">Your Data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Download a copy of everything we store about you — your profile, uploaded resumes, analyses and optimizations — as a JSON file.
          </p>
          <button onClick={exportData} disabled={exporting} className="btn-primary !text-sm disabled:opacity-50 flex items-center gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Preparing export..." : "Export My Data"}
          </button>
        </div>

        <div className="glass rounded-2xl p-6 border border-destructive/50">
          <h2 className="font-heading font-bold mb-2 text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated resumes, analyses and optimizations. This cannot be undone.
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className={`${buttonVariants({ variant: "destructive" })} rounded-xl gap-2`}
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (deleting) return;
          setDeleteOpen(open);
          if (!open) setDeleteConfirm("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, profile, uploaded resumes, analyses and optimized resumes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <label htmlFor="delete-confirm" className={labelClass}>
              Type <strong className="text-foreground font-mono">DELETE</strong> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={deleting}
              className={inputClass}
              placeholder="DELETE"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open while the request is in flight.
                e.preventDefault();
                void deleteAccount();
              }}
              disabled={deleteConfirm !== "DELETE" || deleting}
              className={`${buttonVariants({ variant: "destructive" })} gap-2`}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
