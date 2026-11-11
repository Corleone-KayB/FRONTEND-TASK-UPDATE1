"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Shield } from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { safeReturnUrl } from "@/lib/booking";
import { BackLink } from "@/components/public/BackLink";
import { ApiError, getGoogleOAuthUrl } from "@/lib/api";
import { dashboardPathForRole } from "@/lib/roles";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const returnUrl = searchParams.get("returnUrl");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const password = watch("password");
  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginForm) => {
    setApiError(null);
    try {
      const user = await login(data.email, data.password);
      router.push(returnUrl ? safeReturnUrl(returnUrl) : dashboardPathForRole(user.role));
    } catch (err) {
      setApiError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-1 flex-col p-8 lg:p-14">
      <BackLink fallback="/" className="mb-6" />
      <MindoraLogo />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-mindora-purple-pale px-3 py-1 text-xs font-medium text-mindora-purple">
          Welcome back
        </span>

        <h1 className="text-3xl font-bold tracking-tight">Good to see you again.</h1>
        <p className="mt-2 text-muted-foreground">Sign in to continue your gentle practice.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="theodora@mindora.app"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link href="#" className="text-xs font-medium text-mindora-purple hover:underline">
                Forgot?
              </Link>
            </div>
            <PasswordInput id="password" value={password} {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setValue("rememberMe", checked === true)}
            />
            <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
              Keep me signed in on this device
            </label>
          </div>

          {apiError && <p className="text-xs text-red-500">{apiError}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted-foreground">or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = getGoogleOAuthUrl();
            }}
          >
            <GoogleIcon />
            Google
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to Mindora?{" "}
          <Link
            href={returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : "/signup"}
            className="font-semibold text-mindora-purple hover:underline"
          >
            Create a free account
          </Link>
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" />
        Encrypted & HIPAA-aware. Your story stays yours.
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
