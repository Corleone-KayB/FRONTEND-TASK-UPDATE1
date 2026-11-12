export function getBookNowHref(therapistId: string, isAuthenticated: boolean) {
  const intended = `/appointments/book/${therapistId}`;
  if (isAuthenticated) return intended;
  return `/login?returnUrl=${encodeURIComponent(intended)}`;
}

export function safeReturnUrl(value: string | null | undefined, fallback = "/today") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
