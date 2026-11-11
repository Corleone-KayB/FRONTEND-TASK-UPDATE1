import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <p className="text-lg font-bold text-foreground">Page not found.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
