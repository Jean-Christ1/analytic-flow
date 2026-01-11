import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", backgroundColor: "#1a1a2e", color: "#fff", minHeight: "100vh" }}>
          <h1 style={{ color: "#ff6b6b" }}>Something went wrong</h1>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
            <summary style={{ cursor: "pointer", color: "#ffd93d" }}>Error Details</summary>
            <pre style={{ color: "#ff6b6b", marginTop: "10px" }}>
              {this.state.error?.toString()}
            </pre>
            <pre style={{ color: "#6c757d", marginTop: "10px" }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
