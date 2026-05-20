import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, BarChart3, Sparkles, User, LogOut, LayoutDashboard, Upload } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/upload", icon: Upload, label: "Upload Resume" },
  { to: "/dashboard/analyses", icon: BarChart3, label: "Analyses" },
  { to: "/dashboard/optimizations", icon: Sparkles, label: "Optimizations" },
  { to: "/dashboard/profile", icon: User, label: "Profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-animated-gradient flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-glass-border p-6 fixed h-full z-40">
        <Link to="/dashboard" className="font-heading font-extrabold text-lg gradient-text flex items-center gap-2 mb-10">
          <FileText className="w-5 h-5 text-accent" /> AI Resume Builder
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-400 ${
                  active
                    ? "bg-primary/20 text-accent border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-glass-hover"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-glass-border">
          <p className="text-sm font-medium truncate mb-1">{profile?.name || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize mb-3">{profile?.role || "candidate"}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-all w-full"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-glass-border px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="font-heading font-bold text-sm gradient-text flex items-center gap-1">
          <FileText className="w-4 h-4 text-accent" /> AI Resume
        </Link>
        <div className="flex items-center gap-3">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} aria-label={item.label} className={`p-2 rounded-lg ${location.pathname === item.to ? "text-accent" : "text-muted-foreground"}`}>
              <item.icon className="w-4 h-4" />
            </Link>
          ))}
          <button onClick={signOut} aria-label="Sign out" className="p-2 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 md:ml-64 p-6 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}
