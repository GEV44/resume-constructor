import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Seo from "@/components/Seo";

export default function Signup() {
  const { user, loading, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill in all fields."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    const { error } = await signUp(email, password, name, role);
    setSubmitting(false);
    if (error) { toast.error(error); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-animated-gradient flex items-center justify-center px-4">
        <Seo title="Check Your Email — AI Resume Builder" description="Verify your email address to activate your AI Resume Builder account." path="/signup" />
        <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md text-center">
          <span className="text-5xl block mb-4">✉️</span>
          <h1 className="font-heading font-bold text-2xl mb-2">Check Your Email</h1>
          <p className="text-muted-foreground text-sm mb-6">
            We've sent a verification link to <strong className="text-foreground">{email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" className="text-accent hover:underline text-sm">Go to Login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-animated-gradient flex items-center justify-center px-4">
      <Seo
        title="Sign Up — AI Resume Builder"
        description="Create a free AI Resume Builder account to score and optimize your resume for 30+ job roles."
        path="/signup"
      />
      <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md">
        <Link to="/" className="font-heading font-extrabold text-xl gradient-text flex items-center gap-2 mb-8 justify-center">
          <span>📄</span> AI Resume Builder
        </Link>
        <h1 className="font-heading font-bold text-2xl text-center mb-2">Create Account</h1>
        <p className="text-muted-foreground text-sm text-center mb-8">Start building better resumes today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="text-sm text-muted-foreground mb-1 block">Full Name</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="text-sm text-muted-foreground mb-1 block">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="text-sm text-muted-foreground mb-1 block">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="signup-role" className="text-sm text-muted-foreground mb-1 block">I am a...</label>
            <select
              id="signup-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            >
              <option value="candidate" className="bg-card text-foreground">Candidate</option>
              <option value="recruiter" className="bg-card text-foreground">Recruiter</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full text-center disabled:opacity-50">
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
