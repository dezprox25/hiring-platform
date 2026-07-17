import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  redirect,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

/** App areas that require authentication (prefix match). */
function isProtectedAppPath(pathname: string): boolean {
  return ["/admin", "/hr", "/manager", "/candidate"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    const accessToken = localStorage.getItem("accessToken");
    const path = location.pathname;
    const login = path === "/login";

    if (!accessToken) {
      if (isProtectedAppPath(path)) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
      return;
    }

    if (accessToken && login) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as { role?: string };
          if (user.role) {
            throw redirect({ to: `/${user.role}` });
          }
        } catch {
          /* invalid JSON — allow login so user can re-authenticate */
        }
      }
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "interview-application" },
      { name: "description", content: "Dezprox Talent Flow is a UI-only web application for internal company hiring and interview management." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "interview-application" },
      { property: "og:description", content: "Dezprox Talent Flow is a UI-only web application for internal company hiring and interview management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "interview-application" },
      { name: "twitter:description", content: "Dezprox Talent Flow is a UI-only web application for internal company hiring and interview management." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a02e1002-a908-4b0e-a1d6-910ed5fd9879/id-preview-90290006--280c9054-9337-40f2-ac5e-f1c56142211c.lovable.app-1778492358788.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a02e1002-a908-4b0e-a1d6-910ed5fd9879/id-preview-90290006--280c9054-9337-40f2-ac5e-f1c56142211c.lovable.app-1778492358788.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
