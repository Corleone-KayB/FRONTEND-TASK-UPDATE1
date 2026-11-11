import { apiFetch } from "@/lib/api";
import type { AuthTokenResponse, RegisterRequest } from "@/types/domain";

// POST /api/v1/auth/login
export function login(email: string, password: string): Promise<AuthTokenResponse> {
  return apiFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// POST /api/v1/auth/refresh - HttpOnly refresh cookie is sent automatically via
// apiFetch's credentials: 'include', not passed explicitly here.
export function refreshSession(): Promise<AuthTokenResponse> {
  return apiFetch("/api/v1/auth/refresh", { method: "POST" });
}

// POST /api/v1/auth/register - only returns { userId }, no tokens - callers follow
// up with a real login to establish the session.
export function register(params: RegisterRequest): Promise<{ userId: string }> {
  return apiFetch("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// POST /api/v1/auth/logout
export function logout(): Promise<void> {
  return apiFetch("/api/v1/auth/logout", { method: "POST" });
}
