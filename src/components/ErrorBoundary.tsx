import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches React rendering errors and shows a clean fallback.
 * This prevents a broken component from taking down the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for developer diagnostics
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center min-h-[40vh] gap-6 p-8 max-w-md mx-auto text-center"
        >
          <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-700 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-800 dark:text-parchment-50">
              Алдаа гарлаа
            </h1>
            <p className="text-sm text-ink-500 dark:text-ink-200 mt-2">
              The app encountered an error. Try refreshing the page.
            </p>
          </div>
          <button
            onClick={this.handleRefresh}
            className="px-5 py-2.5 rounded-md bg-ink-800 text-parchment-50 font-medium text-sm hover:bg-ink-700 dark:bg-brass-600 dark:text-ink-900 dark:hover:bg-brass-500 transition focus-ring"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
