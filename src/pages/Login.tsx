import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Seo from "@/components/Seo";

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields."); return; }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) toast.error(error);
  };

  return (
    <main className="min-h-screen bg-animated-gradient flex items-center justify-center px-4">
      <Seo
        title="Log In — AI Resume Builder"
        description="Sign in to your AI Resume Builder account to access resume analyses, optimizations, and your dashboard."
        path="/login"
      />
      <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md">
        <Link to="/" className="font-heading font-extrabold text-xl gradient-text flex items-center gap-2 mb-8 justify-center">
          <span>📄</span> AI Resume Builder
        </Link>
        <h1 className="font-heading font-bold text-2xl text-center mb-2">Log In to AI Resume Builder</h1>
        <p className="text-muted-foreground text-sm text-center mb-8">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-sm text-muted-foreground mb-1 block">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-sm text-muted-foreground mb-1 block">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full text-center disabled:opacity-50">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
