import { Suspense } from "react";
import { SignupBrandingPanel } from "@/components/auth/SignupBrandingPanel";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <SignupBrandingPanel />
      <div className="flex flex-col bg-white">
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
