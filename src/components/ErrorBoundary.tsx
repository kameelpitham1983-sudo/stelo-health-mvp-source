import { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="card p-8 max-w-md text-center">
            <AlertCircle size={32} className="text-danger-500 mx-auto mb-4" />
            <h2 className="text-lg font-display font-bold text-ink-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-ink-500 mb-4">{this.state.message}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
