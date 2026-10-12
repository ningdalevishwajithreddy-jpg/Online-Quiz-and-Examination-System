import { Component } from 'react';
import { RotateCcw } from 'lucide-react';

import { ErrorState } from './ui/Feedback';
import { Button } from './ui/Button';

/**
 * Catches render-time errors so a single broken component cannot blank the
 * whole application. No stack trace is shown to the user; it is logged instead.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // A crash must be visible in the console for whoever is debugging it.
    console.error('[QuizSphere] render error', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <ErrorState
          title="This page ran into a problem"
          description="The error has been logged in the browser console. Reloading usually clears it."
        />
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="secondary" icon={RotateCcw} onClick={this.handleReset}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.assign('/')}>
            Go home
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
