import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mindora-purple focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-mindora-purple text-white hover:bg-mindora-purple-dark",
        outline: "border border-border bg-white text-foreground hover:bg-mindora-purple-bg",
        ghost: "text-mindora-purple hover:bg-mindora-purple-pale",
        dark: "bg-mindora-card-dark text-white hover:bg-mindora-sidebar-hover",
        secondary: "bg-mindora-purple-pale text-mindora-purple hover:bg-mindora-purple-bg",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
