import { getBookNowHref, safeReturnUrl } from "@/lib/booking";

describe("getBookNowHref", () => {
  it("goes straight to the booking page when logged in", () => {
    expect(getBookNowHref("user-1", true)).toBe("/appointments/book/user-1");
  });

  it("sends logged-out users to login with the booking page as return path", () => {
    const href = getBookNowHref("user-1", false);
    expect(href).toBe("/login?returnUrl=%2Fappointments%2Fbook%2Fuser-1");
    const returnUrl = new URL(href, "http://x").searchParams.get("returnUrl");
    expect(safeReturnUrl(returnUrl)).toBe("/appointments/book/user-1");
  });
});
