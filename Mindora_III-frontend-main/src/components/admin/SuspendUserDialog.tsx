"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReactivateUser, useSuspendUser } from "@/hooks/useAdmin";
import type { AdminUserRecord } from "@/types/domain";

interface SuspendUserDialogProps {
  user: AdminUserRecord | null;
  onOpenChange: (open: boolean) => void;
}

export function SuspendUserDialog({ user, onOpenChange }: SuspendUserDialogProps) {
  const [reason, setReason] = useState("");
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();
  const mutation = user?.isActive ? suspendMutation : reactivateMutation;
  const action = user?.isActive ? "Suspend" : "Reactivate";

  function handleOpenChange(open: boolean) {
    if (!open) {
      setReason("");
      suspendMutation.reset();
      reactivateMutation.reset();
    }
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!user || !reason.trim()) return;
    try {
      await mutation.mutateAsync({ id: user.id, reason: reason.trim() });
      handleOpenChange(false);
    } catch {
      // Surfaced via mutation.isError below - nothing more to do here.
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        {user && (
          <>
            <DialogHeader>
              <DialogTitle>
                {action} {user.email}
              </DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                {user.isActive
                  ? "Their access token stops working immediately and refresh tokens are revoked."
                  : "Their account will be able to sign in again."}
              </p>
            </DialogHeader>

            <div>
              <label
                htmlFor="admin-action-reason"
                className="mb-2 block text-[12.5px] font-bold text-popover-foreground/75"
              >
                Reason
              </label>
              <Textarea
                id="admin-action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Why are you taking this action? (1–500 characters)"
                className="min-h-[90px]"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {reason.length}/500
              </p>

              {mutation.isError && (
                <div className="mt-3 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {mutation.error?.message ?? `Could not ${action.toLowerCase()} this user.`}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={reason.trim().length === 0 || mutation.isPending}
                  className={
                    user.isActive ? "bg-destructive text-white hover:bg-destructive/90" : undefined
                  }
                >
                  {mutation.isPending ? `${action}ing…` : action}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
