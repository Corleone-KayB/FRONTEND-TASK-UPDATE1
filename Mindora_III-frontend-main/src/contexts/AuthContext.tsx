"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setAccessToken } from "@/lib/api";
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  register as registerRequest,
} from "@/lib/auth-api";
import type { RegisterRequest } from "@/types/domain";

interface User {
  userId: string;
  email: string;
  role: "PATIENT" | "THERAPIST" | "ADMIN";
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (params: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Thrown specifically for a structurally-valid JWT whose `sub` isn't a UUID -
// distinct from a plain parse failure so callers can react to it (see initAuth).
class InvalidSessionError extends Error {}

// Every real account's id comes from Prisma's @default(uuid()), so a non-UUID
// sub means this token wasn't issued by a real /login - most likely a stale
// hand-made dev token still sitting in the refresh cookie from before dev-login
// was removed. Every backend route that casts userId to ::uuid in SQL 500s on
// it, so reject it here rather than let the app run on a broken identity until
// it surfaces as an unexplained crash in some unrelated feature later.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The Auth Service's /login and /refresh only ever return { accessToken } -
// there is no `user` field on that response. Identity claims (userId/email/role)
// live in the JWT payload itself, so decode them from there instead of expecting
// the server to send a separate user object.
function userFromAccessToken(token: string): User {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = JSON.parse(atob(base64));
  if (typeof decoded.sub !== "string" || !UUID_PATTERN.test(decoded.sub)) {
    throw new InvalidSessionError("Access token has a non-UUID subject.");
  }
  return { userId: decoded.sub, email: decoded.email, role: decoded.role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const setToken = useCallback((token: string | null) => {
    setTokenState(token);
    setAccessToken(token); // sync to in-memory store for apiFetch
  }, []);

  // On mount - attempt silent refresh using HttpOnly cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await refreshSession();
        const refreshedUser = userFromAccessToken(data.accessToken);
        setToken(data.accessToken);
        setUser(refreshedUser);
      } catch (err) {
        // No valid session - user needs to log in
        setToken(null);
        setUser(null);
        if (err instanceof InvalidSessionError) {
          // Clearing local state alone isn't enough here - the refresh cookie
          // itself is the broken part, so the next reload would just refresh
          // right back into this same invalid token. Best-effort: also ask the
          // server to drop it so it can't keep resurfacing.
          logoutRequest().catch(() => {});
        }
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [setToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginRequest(email, password);
      // Whatever's cached belongs to whoever was signed in before (or nobody) -
      // purge it so a different account never briefly renders with stale data
      // left over from a prior session in this same tab.
      queryClient.clear();
      setToken(data.accessToken);
      const loggedInUser = userFromAccessToken(data.accessToken);
      setUser(loggedInUser);
      return loggedInUser;
    },
    [setToken, queryClient]
  );

  // POST /register only returns { userId } - no tokens - so a successful
  // registration is followed by a real login to establish the session.
  const register = useCallback(
    async (params: RegisterRequest) => {
      await registerRequest(params);
      return login(params.email, params.password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setToken(null);
      setUser(null);
      queryClient.clear();
    }
  }, [setToken, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        register,
        logout,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
