import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/Seo";

const inputClass =
  "w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

/** Supabase reports failed/expired links via `#error=...` (or `?error=...`). */
function linkErrorFromUrl(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  const desc = params.get("error_description") || search.get("error_description");
  const err = params.get("error") || search.get("error");
  if (!err && !desc) return null;
  return desc ? desc.replace(/\+/g, " ") : "This reset link is invalid or has expired.";
}

export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [linkError] = useState<string | null>(() => linkErrorFromUrl());
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    const timer = window.setTimeout(() => setTimedOut(true), 1500);
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const hasSession = !!session || recovery;
  const invalid = !hasSession && (!!linkError || (timedOut && !loading));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated! You're now signed in.");
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen bg-animated-gradient flex items-center justify-center px-4">
      <Seo
        title="Reset Password — AI Resume Builder"
        description="Choose a new password for your AI Resume Builder account."
        path="/reset-password"
      />
      <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md">
        <Link to="/" className="font-heading font-extrabold text-xl gradient-text flex items-center gap-2 mb-8 justify-center">
          <span>📄</span> AI Resume Builder
        </Link>

        {hasSession ? (
          <>
            <KeyRound className="w-10 h-10 text-accent mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl text-center mb-2">Set a New Password</h1>
            <p className="text-muted-foreground text-sm text-center mb-8">Choose a strong password you haven't used before.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-password" className="text-sm text-muted-foreground mb-1 block">New Password</label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label htmlFor="reset-password-confirm" className="text-sm text-muted-foreground mb-1 block">Confirm Password</label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full text-center disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        ) : invalid ? (
          <div className="text-center">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl mb-2">Invalid or Expired Link</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {linkError ?? "This password reset link is invalid or has expired."} Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-block !text-sm">Request a New Link</Link>
            <p className="text-sm text-muted-foreground mt-6">
              <Link to="/login" className="text-accent underline underline-offset-4 hover:text-foreground">Back to login</Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm">Verifying your reset link...</p>
          </div>
        )}
      </div>
    </main>
  );
}
