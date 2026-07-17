import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { getRouter } from "./router";
import { GlobalErrorBoundary } from "./components/error-boundary";
import { Toaster } from "./components/ui/sonner";
import "./styles.css";

// Sentry Initialization
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, 
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const router = getRouter(queryClient);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
