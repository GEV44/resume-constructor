import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to update name."); return; }
    await refreshProfile();
    toast.success("Name updated!");
  };

  const changePassword = async () => {
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    setNewPassword("");
    toast.success("Password updated!");
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2">Profile Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account details.</p>

        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-heading font-bold mb-4">Account Info</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full glass rounded-xl px-4 py-3 bg-transparent text-muted-foreground opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Role</label>
              <input
                type="text"
                value={profile?.role || "candidate"}
                disabled
                className="w-full glass rounded-xl px-4 py-3 bg-transparent text-muted-foreground opacity-60 cursor-not-allowed capitalize"
              />
            </div>
            <button onClick={saveName} disabled={saving} className="btn-primary !text-sm disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-bold mb-4">Change Password</h3>
          <div className="space-y-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button onClick={changePassword} disabled={changingPassword} className="btn-primary !text-sm disabled:opacity-50 flex items-center gap-2">
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
