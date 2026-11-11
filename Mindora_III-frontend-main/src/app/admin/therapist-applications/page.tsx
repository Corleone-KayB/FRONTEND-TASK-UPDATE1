"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAdminTherapistApplications } from "@/hooks/useAdmin";
import {
  THERAPIST_APPLICATION_STATUS_BADGE_VARIANT,
  THERAPIST_APPLICATION_STATUS_LABEL,
} from "@/lib/therapist-application";
import type { TherapistApplicationStatus } from "@/types/domain";

type StatusFilter = "all" | TherapistApplicationStatus;
type SortBy = "submittedAt" | "createdAt" | "reviewedAt" | "fullName";

const STATUS_OPTIONS: StatusFilter[] = [
  "all",
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
  "APPROVED",
  "REJECTED",
];

const SORT_COLUMNS: { key: SortBy; label: string }[] = [
  { key: "fullName", label: "Applicant" },
  { key: "submittedAt", label: "Submitted" },
  { key: "createdAt", label: "Created" },
  { key: "reviewedAt", label: "Reviewed" },
];

const LIMIT = 20;

export default function AdminTherapistApplicationsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("submittedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Debounce the search box rather than firing a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError } = useAdminTherapistApplications({
    status: status === "all" ? undefined : status,
    search: search || undefined,
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
  });

  const applications = data?.applications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function toggleSort(key: SortBy) {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
    setPage(1);
  }

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          Therapist Applications
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Review, approve, or request more information on applications to join as a therapist.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, or license number"
          className="h-12 w-[280px] rounded-xl"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus((v as StatusFilter) ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-12 w-[220px] rounded-xl border-0 bg-transparent px-4 shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All statuses" : THERAPIST_APPLICATION_STATUS_LABEL[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          Could not load applications.
        </div>
      )}

      {isLoading ? (
        <p className="py-5 text-[13.5px] text-muted-foreground">Loading applications…</p>
      ) : (
        <div className="overflow-hidden rounded-[26px] bg-white p-2 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
          <div className="flex items-center gap-4 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {SORT_COLUMNS.map((col) => (
              <button
                key={col.key}
                type="button"
                onClick={() => toggleSort(col.key)}
                className="inline-flex items-center gap-1 hover:text-mindora-purple"
              >
                {col.label}
                {sortBy === col.key &&
                  (sortOrder === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  ))}
              </button>
            ))}
          </div>

          {applications.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13.5px] text-muted-foreground">
              No applications match these filters.
            </p>
          ) : (
            applications.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => router.push(`/admin/therapist-applications/${app.id}`)}
                className="flex w-full items-center justify-between gap-4 rounded-[18px] px-3.5 py-4 text-left hover:bg-mindora-purple-bg/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {app.fullName || "Untitled application"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {app.contactEmail || "No email yet"}
                    {app.licenseNumber && ` · License ${app.licenseNumber}`}
                  </p>
                </div>
                <p className="shrink-0 text-[12px] text-muted-foreground">
                  {app.submittedAt
                    ? `Submitted ${new Date(app.submittedAt).toLocaleDateString()}`
                    : `Created ${new Date(app.createdAt).toLocaleDateString()}`}
                </p>
                <Badge
                  variant={THERAPIST_APPLICATION_STATUS_BADGE_VARIANT[app.status]}
                  className="shrink-0"
                >
                  {THERAPIST_APPLICATION_STATUS_LABEL[app.status]}
                </Badge>
              </button>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-[12.5px] font-semibold text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
