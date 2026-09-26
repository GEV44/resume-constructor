import { Component, type ErrorInfo, type ReactNode } from "react";

interface State { error: Error | null }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="min-h-screen bg-animated-gradient flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md text-center">
          <h1 className="font-heading font-bold text-2xl mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-6">An unexpected error occurred. Reloading usually fixes it — your data is safe.</p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full">Reload</button>
        </div>
      </main>
    );
  }
}
