/** Shape stored in localStorage after POST /auth/login */
export type StoredAuthUser = {
  id?: string;
  email?: string;
  role?: string;
  fullName?: string;
};

const ROLE_FALLBACK: Record<string, { name: string; email: string }> = {
  admin: { name: "Priya Malhotra", email: "priya@dezprox.com" },
  manager: { name: "Karan Mehta", email: "karan@dezprox.com" },
  hr: { name: "Neha Gupta", email: "neha@dezprox.com" },
  candidate: { name: "Aarav Sharma", email: "aarav@dezprox.com" },
};

export function getStoredAuthUser(): StoredAuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

/** Display name when API login only returns email + role (no fullName). */
export function getAuthDisplayName(
  user: StoredAuthUser | null | undefined,
  role?: string,
): string {
  if (user?.fullName?.trim()) return user.fullName.trim();
  if (user?.email) {
    const local = user.email.split("@")[0] ?? "";
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  const key = user?.role ?? role;
  if (key && ROLE_FALLBACK[key]) return ROLE_FALLBACK[key].name;
  return "User";
}

export function getAuthFirstName(
  user: StoredAuthUser | null | undefined,
  role?: string,
): string {
  return getAuthDisplayName(user, role).split(/\s+/)[0] ?? "User";
}
