import { Link, useLocation } from "react-router-dom";
import Seo from "@/components/Seo";

export default function NotFound() {
  const location = useLocation();
  return (
    <main className="min-h-screen bg-animated-gradient flex items-center justify-center px-4">
      <Seo
        title="Page Not Found — AI Resume Builder"
        description="The page you're looking for doesn't exist. Return to AI Resume Builder to score and optimize your resume."
        path={location.pathname}
      />
      <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md text-center">
        <p className="font-heading font-black text-7xl gradient-text mb-2">404</p>
        <h1 className="font-heading font-bold text-2xl mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-8">
          <span className="font-mono">{location.pathname}</span> doesn't exist or has moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary !text-sm inline-flex items-center justify-center">Go home</Link>
          <Link to="/dashboard" className="glass rounded-xl px-5 py-3 text-sm font-heading font-bold hover:bg-glass-hover inline-flex items-center justify-center">Open dashboard</Link>
        </div>
      </div>
    </main>
  );
}
