import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { toast.error("Please enter your email."); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    // Rate limiting is the only error worth surfacing; anything else would leak
    // whether an account exists, so we always show the same neutral state.
    if (error && error.status === 429) {
      toast.error("Too many requests. Please wait a moment and try again.");
      return;
    }
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-animated-gradient flex items-center justify-center px-4">
      <Seo
        title="Forgot Password — AI Resume Builder"
        description="Reset the password for your AI Resume Builder account."
        path="/forgot-password"
      />
      <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md">
        <Link to="/" className="font-heading font-extrabold text-xl gradient-text flex items-center gap-2 mb-8 justify-center">
          <span>📄</span> AI Resume Builder
        </Link>

        {sent ? (
          <div className="text-center">
            <MailCheck className="w-12 h-12 text-accent mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl mb-2">Check Your Email</h1>
            <p className="text-muted-foreground text-sm mb-6">
              If an account exists for that email, a reset link is on its way. It may take a few minutes to arrive.
            </p>
            <Link to="/login" className="text-accent hover:underline text-sm">Back to Login</Link>
          </div>
        ) : (
          <>
            <h1 className="font-heading font-bold text-2xl text-center mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground text-sm text-center mb-8">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="text-sm text-muted-foreground mb-1 block">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full text-center disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Remembered it?{" "}
              <Link to="/login" className="text-accent underline underline-offset-4 hover:text-foreground">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
