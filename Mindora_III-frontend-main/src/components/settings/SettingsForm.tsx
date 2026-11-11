"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile, useUpdateProfile } from "@/hooks/useMyProfile";
import { useUpdateNotificationPreferences, useUserPreferences } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { NotificationPreferences } from "@/types/domain";

const PREFERENCE_LABELS: Record<keyof NotificationPreferences, string> = {
  push: "Push notifications",
  email: "Email notifications",
  sms: "SMS notifications",
};

const PREFERENCE_KEYS = Object.keys(PREFERENCE_LABELS) as (keyof NotificationPreferences)[];

export function SettingsForm() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useMyProfile();
  const {
    data: preferences,
    isLoading: preferencesLoading,
    isError: preferencesError,
  } = useUserPreferences(user?.userId);

  const updateProfileMutation = useUpdateProfile();
  const updatePreferencesMutation = useUpdateNotificationPreferences();

  // null means "not yet edited by the user" - fall back to the loaded profile
  // value in that case. A plain useState instead of react-hook-form, same as
  // the rest of this app's simple forms (e.g. CheckInForm); this avoids
  // syncing server data into local state via an effect, which would otherwise
  // trip react-hooks/set-state-in-effect.
  const [userNameDraft, setUserNameDraft] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pendingKey, setPendingKey] = useState<keyof NotificationPreferences | null>(null);

  const userName = userNameDraft ?? profile?.profile?.userName ?? "";
  const bio = bioDraft ?? profile?.profile?.bio ?? "";

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaved(false);
    // Only send fields that were actually touched and actually changed, per
    // the partial-update contract.
    const body: { userName?: string; bio?: string } = {};
    if (userNameDraft !== null && userNameDraft !== (profile?.profile?.userName ?? "")) {
      body.userName = userNameDraft;
    }
    if (bioDraft !== null && bioDraft !== (profile?.profile?.bio ?? "")) {
      body.bio = bioDraft;
    }
    if (Object.keys(body).length === 0) return;
    updateProfileMutation.mutate(body, { onSuccess: () => setProfileSaved(true) });
  }

  function handleToggle(key: keyof NotificationPreferences, current: boolean) {
    setPendingKey(key);
    updatePreferencesMutation.mutate({ [key]: !current }, { onSettled: () => setPendingKey(null) });
  }

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Manage your profile and notification preferences.
          </p>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[26px] bg-white p-8 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
            <h2 className="text-[18px] font-bold text-foreground">Profile</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              This is how other people on Mindora see you.
            </p>

            {profileError && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
                Could not load your profile.
              </div>
            )}

            {profileLoading ? (
              <div className="mt-4 h-40 animate-pulse rounded-2xl bg-mindora-purple-bg" />
            ) : (
              <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-username">Display name</Label>
                  <Input
                    id="settings-username"
                    value={userName}
                    onChange={(e) => {
                      setUserNameDraft(e.target.value);
                      setProfileSaved(false);
                    }}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-bio">Bio</Label>
                  <Textarea
                    id="settings-bio"
                    value={bio}
                    onChange={(e) => {
                      setBioDraft(e.target.value);
                      setProfileSaved(false);
                    }}
                    placeholder="A short bio"
                    rows={4}
                  />
                </div>

                {profileSaved && !updateProfileMutation.isPending && (
                  <p className="text-[13px] font-medium text-mindora-success">Saved.</p>
                )}

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </form>
            )}
          </section>

          <section className="overflow-hidden rounded-[26px] bg-white p-8 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
            <h2 className="text-[18px] font-bold text-foreground">Notifications</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Choose how you want to hear from Mindora.
            </p>

            {preferencesError && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
                Could not load your notification preferences.
              </div>
            )}

            {preferencesLoading ? (
              <div className="mt-4 h-28 animate-pulse rounded-2xl bg-mindora-purple-bg" />
            ) : (
              preferences && (
                <div className="mt-4 divide-y divide-border">
                  {PREFERENCE_KEYS.map((key) => {
                    const value = preferences.notificationPreferences[key];
                    const isPending = pendingKey === key && updatePreferencesMutation.isPending;
                    return (
                      <div key={key} className="flex items-center justify-between py-3.5">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">
                            {PREFERENCE_LABELS[key]}
                          </p>
                          {isPending && (
                            <p className="text-[11.5px] text-muted-foreground">Saving…</p>
                          )}
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={value}
                          aria-label={PREFERENCE_LABELS[key]}
                          disabled={isPending}
                          onClick={() => handleToggle(key, value)}
                          className={cn(
                            "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            value ? "bg-mindora-purple" : "bg-border"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                              value ? "translate-x-5" : "translate-x-0.5"
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
