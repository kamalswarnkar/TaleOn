import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-inter flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="font-orbitron text-2xl text-[#ff006f] mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-[#ccc] mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full font-orbitron px-4 py-2 bg-[#00c3ff] text-black rounded-md hover:shadow-[0_0_15px_#00c3ff] transition duration-300"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full font-orbitron px-4 py-2 border border-[#00c3ff] text-[#00c3ff] rounded-md hover:bg-[#00c3ff] hover:text-black transition duration-300"
              >
                Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-[#00c3ff] hover:underline">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-[#111] rounded text-xs overflow-auto">
                  <pre className="text-red-400">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                  <pre className="text-gray-400 mt-2">
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
