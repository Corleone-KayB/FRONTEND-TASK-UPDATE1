import { Suspense } from "react";
import { MessagesView } from "@/components/messaging/MessagesView";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#eae6f4] text-muted-foreground">
          Loading messages…
        </div>
      }
    >
      <MessagesView />
    </Suspense>
  );
}
