const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.mindora.rw";

// Token stored in memory - never in localStorage (XSS protection)
// Access token lives in React state via AuthContext
// Refresh token lives in HttpOnly cookie set by Auth Service
let inMemoryAccessToken: string | null = null;

// Notifies subscribers on every token change - login, silent refresh (below), and
// logout alike. This is the one choke point every code path already updates the
// token through, so it's also the one place that can tell the messaging socket
// (which lives outside React/AuthContext) to reconnect with a fresh token instead
// of running on a stale one until the next unrelated 401 happens to trigger a
// refresh.
type TokenListener = (token: string | null) => void;
const tokenListeners = new Set<TokenListener>();

export function onAccessTokenChange(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

export class ApiError extends Error {
  status: number;
  // Zod's flatten().fieldErrors shape, e.g. { email: ["Invalid email address"] } -
  // present on 400 validation failures, absent otherwise.
  fieldErrors?: Record<string, string[]>;
  // Full parsed error response body, for callers that need endpoint-specific
  // fields apiFetch itself doesn't know about (e.g. the AI chat endpoint's
  // retryAfterSeconds on 429). Most callers only need message/status/fieldErrors.
  body?: unknown;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string[]>,
    body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.body = body;
  }
}

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  tokenListeners.forEach((listener) => listener(token));
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

// OAuth is a full browser redirect, not a fetch call - Google's consent screen has to be
// a real page navigation. Point window.location at this to start the flow.
export function getGoogleOAuthUrl(): string {
  return `${API_URL}/api/v1/auth/oauth/google`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (inMemoryAccessToken) {
    headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
  }

  const method = options.method ?? "GET";
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include", // sends HttpOnly refresh token cookie automatically
    });
  } catch (networkError) {
    // fetch() itself throws for anything that never got an HTTP response at all -
    // backend down, DNS failure, offline, CORS rejection, etc. This is the one
    // failure mode that isn't an ApiError from a server response, so log it here:
    // it's the only place in the app that sees it, and every caller's generic
    // "something went wrong" catch-all would otherwise swallow it silently.
    console.error(`[api] ${method} ${path} - network error, no response received`, networkError);
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  // Silent token refresh on 401 - only meaningful for requests that carried a session
  // token to begin with. Login/refresh themselves returning 401 means invalid
  // credentials or no session, not an expired token, so skip the retry dance there
  // and let the real server error surface below.
  const isAuthEndpoint = path === "/api/v1/auth/refresh" || path === "/api/v1/auth/login";
  if (response.status === 401 && !isAuthEndpoint) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry original request with new token
      headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
    } else {
      // Refresh failed - clear token, let AuthContext handle redirect
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    // Almost every endpoint uses {message, errors} on failure, but at least one
    // (AI chat's 400) uses {error} instead - fall back to that key rather than
    // losing the real validation string behind a generic "API error: 400".
    const message = error.message ?? error.error ?? `API error: ${response.status}`;
    console.error(`[api] ${method} ${path} - ${response.status} ${message}`);
    throw new ApiError(message, response.status, error.errors, error);
  }

  // Handle 204 No Content
  if (response.status === 204) return null as T;

  return response.json();
}

// Variant of apiFetch for multipart uploads (e.g. therapist application
// documents). Deliberately does not set Content-Type - the browser must set
// it itself, with the multipart boundary, which it only does when it sees
// the raw FormData body and no explicit header. Otherwise mirrors apiFetch
// exactly: same auth header, same 401-refresh-and-retry, same ApiError shape.
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  if (inMemoryAccessToken) {
    headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });
  } catch (networkError) {
    console.error(`[api] POST ${path} - network error, no response received`, networkError);
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
      response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });
    } else {
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    const message = error.message ?? error.error ?? `API error: ${response.status}`;
    console.error(`[api] POST ${path} - ${response.status} ${message}`);
    throw new ApiError(message, response.status, error.errors, error);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    // HttpOnly cookie is sent automatically via credentials: 'include'
    const data = await apiFetch<{ accessToken: string }>("/api/v1/auth/refresh", {
      method: "POST",
    });
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}
