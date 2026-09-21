import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { logout, api } from "../lib/api";
import { canAccessAdmin, normalizeRole } from "../lib/roleUtils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Synchronous session validation
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const hasCredentials = !!(token && userStr);
    let parsedUser: any = null;
    if (hasCredentials) {
      try {
        parsedUser = JSON.parse(userStr as string);
      } catch {
        parsedUser = null;
      }
    }
    const credentialsOk = hasCredentials && parsedUser !== null;

    if (!credentialsOk) {
      logout();
      return;
    }

    if (!requireAdmin) {
      // Keep the cached role normalized so downstream comparisons stay consistent.
      if (parsedUser?.role && normalizeRole(parsedUser.role) !== parsedUser.role) {
        localStorage.setItem("user", JSON.stringify({ ...parsedUser, role: normalizeRole(parsedUser.role) }));
      }
      setAuthorized(true);
      return;
    }

    // Admin route: consult the source of truth (/me) so a stale or
    // case-variant role held in localStorage (e.g. a promotion during the
    // session) is honored.
    let cancelled = false;
    setLoading(true);
    const currentToken = localStorage.getItem("token");
    fetch(api("/api/auth/me"), {
      headers: { Authorization: `Bearer ${currentToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`me status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const fresh = data?.data ?? {};
        const role = normalizeRole(fresh.role);
        localStorage.setItem("user", JSON.stringify({ ...fresh, role }));
        setAuthorized(canAccessAdmin(role));
      })
      .catch(() => {
        if (cancelled) return;
        // /me unavailable (offline, 5xx, ...): fall back to the normalized
        // cached role so case variants still resolve when offline.
        setAuthorized(canAccessAdmin(parsedUser?.role));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requireAdmin]);

  // Synchronous gate: invalid session -> redirect immediately.
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const hasCredentials = !!(token && userStr);
  let parsedUser: any = null;
  if (hasCredentials) {
    try {
      parsedUser = JSON.parse(userStr as string);
    } catch {
      parsedUser = null;
    }
  }
  const credentialsOk = hasCredentials && parsedUser !== null;

  if (!credentialsOk) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (!requireAdmin) {
    // Any authenticated user may proceed.
    return <>{children}</>;
  }

  // Admin route: wait for the authoritative /me resolution.
  if (authorized === false) {
    return <Navigate to="/" replace />;
  }

  if (loading || authorized === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#9A7DB2]">
        <div className="w-10 h-10 rounded-full border-2 border-t-gold border-[#4B2170]/30 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
