"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { getBookNowHref } from "@/lib/booking";

export function BookNowButton({
  therapistId,
  className,
  size = "sm",
}: {
  therapistId: string;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const { isAuthenticated } = useAuth();

  return (
    <Button asChild size={size} className={className}>
      <Link href={getBookNowHref(therapistId, isAuthenticated)}>Book Now</Link>
    </Button>
  );
}
