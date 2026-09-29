import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Frontend render failed', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-[#FAFAFA] px-5 py-16 text-[#1A1A1A]">
        <section className="mx-auto max-w-xl border-t-4 border-[#006F3C] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-[#006F3C]">GBBookings</p>
          <h1 className="mt-2 text-2xl font-bold">The page could not be displayed</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Reload the page to retry. The error has also been written to the browser console for debugging.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#006F3C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005C32]"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Reload page
          </button>
        </section>
      </main>
    );
  }
}
