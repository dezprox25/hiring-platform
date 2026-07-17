/**
 * HTTP API base (no trailing slash).
 * In Vite dev, omit `VITE_API_URL` to use same-origin requests + `vite.config` proxy.
 */
export function getHttpApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) {
    return String(fromEnv).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return "http://localhost:4000";
}
