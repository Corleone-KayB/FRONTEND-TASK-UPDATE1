import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "pending" | "streak" | "secondary" | "destructive";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "default" && "bg-mindora-purple-pale text-mindora-purple",
        variant === "success" && "bg-mindora-success-bg text-mindora-success",
        variant === "pending" && "bg-mindora-pending-bg text-mindora-purple",
        variant === "streak" &&
          "bg-mindora-purple text-white gap-1.5 px-4 py-2 text-sm font-semibold",
        variant === "secondary" && "bg-muted text-muted-foreground",
        variant === "destructive" && "bg-red-100 text-red-700",
        className
      )}
    >
      {children}
    </span>
  );
}
