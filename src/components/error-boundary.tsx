import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    if (import.meta.env.PROD) {
      Sentry.captureException(error, { extra: { errorInfo } });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            An unexpected error occurred in the application. We've been notified and are looking into it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button 
              onClick={() => window.location.reload()} 
              className="rounded-xl px-8"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reload Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-xl px-8"
            >
              Try Again
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-8 max-w-2xl overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground border">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
