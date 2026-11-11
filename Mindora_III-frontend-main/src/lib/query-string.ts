// Shared by every lib/*-api.ts GET wrapper that takes optional filter/pagination
// params - was previously copy-pasted separately into mood-api.ts, appointments-api.ts,
// and admin-api.ts.
export function toQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const query = qs.toString();
  return query ? `?${query}` : "";
}
