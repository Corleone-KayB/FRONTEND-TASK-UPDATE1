"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/domain";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleItemClick(item: NotificationItem) {
    if (!item.readAt) markRead.mutate(item.id);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative rounded-md p-1.5 text-[#8d84a6] hover:text-white"
      >
        <Bell className="h-4 w-4" strokeWidth={2.25} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a78bfa] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-mindora-sidebar shadow-[10px_10px_22px_#171320,-10px_-10px_22px_#2b2638]">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[13px] font-bold text-white">Notifications</p>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0 || markAllRead.isPending}
              className="text-[11px] font-semibold text-[#a78bfa] hover:text-[#c4b5fd] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-[#8d84a6]">
                No notifications yet.
              </p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-t border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5",
                    !item.readAt && "bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {!item.readAt && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#a78bfa]" />
                    )}
                    <p className="truncate text-[13px] font-semibold text-white">{item.title}</p>
                  </div>
                  <p className="line-clamp-2 text-[12px] text-[#a29ab6]">{item.body}</p>
                  <p className="text-[10.5px] text-[#6d6588]">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
