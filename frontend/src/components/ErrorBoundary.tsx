import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real app, ship this to Sentry / App Insights.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary captured:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="glass max-w-md w-full p-8 text-center">
            <div className="grid place-items-center size-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 mb-4">
              <AlertTriangle />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-1">Something broke.</h2>
            <p className="text-sm text-slate-400 mb-6">{this.state.error.message}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              <RefreshCcw className="size-4" /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
