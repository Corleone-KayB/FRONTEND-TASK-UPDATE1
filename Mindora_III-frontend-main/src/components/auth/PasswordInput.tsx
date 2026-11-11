"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showStrength?: boolean;
}

export function PasswordInput({
  showStrength = false,
  className,
  value,
  onChange,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const password = typeof value === "string" ? value : "";

  const strength = getPasswordStrength(password);
  const strengthLabel = getStrengthLabel(strength);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          className={cn("pr-12", className)}
          value={value}
          onChange={onChange}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && password.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  level <= strength ? "bg-mindora-purple" : "bg-border"
                )}
              />
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground">{strengthLabel}</p>
        </div>
      )}
    </div>
  );
}

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getStrengthLabel(strength: number): string {
  const labels = [
    "",
    "Weak - add more characters",
    "Fair - getting there",
    "Strong - keep it secret, keep it safe.",
    "Strong - keep it secret, keep it safe.",
  ];
  return labels[strength] ?? "";
}
