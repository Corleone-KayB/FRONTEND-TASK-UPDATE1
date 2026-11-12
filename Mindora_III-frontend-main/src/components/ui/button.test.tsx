import { buttonVariants } from "@/components/ui/button";

describe("buttonVariants touch targets", () => {
  it("keeps small and icon-small buttons at 44px below the lg breakpoint", () => {
    expect(buttonVariants({ size: "sm" })).toContain("h-11");
    expect(buttonVariants({ size: "sm" })).toContain("lg:h-9");
    expect(buttonVariants({ size: "icon-sm" })).toContain("h-11 w-11");
    expect(buttonVariants({ size: "icon-sm" })).toContain("lg:h-8 lg:w-8");
  });
});
