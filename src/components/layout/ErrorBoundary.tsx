import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * The last line of defence.
 *
 * A render error in one feature should not leave a blank page: the viewer still gets the
 * brand, an explanation and a way back. It is deliberately plain — it must not depend on
 * any context that might itself be the thing that failed.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[portfolio] render failed', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="container" style={{ paddingBlock: '18vh', display: 'grid', gap: 14, justifyItems: 'start' }}>
        <h1 className="display" style={{ margin: 0, fontSize: 'clamp(30px, 4.4vw, 52px)', lineHeight: 0.95 }}>
          Something broke on this page
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', maxWidth: '52ch' }}>
          The rest of the portfolio is fine. Reloading usually clears it.
        </p>
        <button type="button" className="btn" onClick={this.reset}>
          Try again
        </button>
      </main>
    );
  }
}
