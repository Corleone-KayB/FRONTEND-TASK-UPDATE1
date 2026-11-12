import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminModerationPage from "@/app/admin/moderation/page";
import AdminAlertsPage from "@/app/admin/alerts/page";
import AdminOverviewPage from "@/app/admin/page";
import { ApiError } from "@/lib/api";
import {
  useAlerts,
  useModerationQueue,
  usePlatformAnalytics,
  useResolveAlert,
  useResolveModerationReport,
} from "@/hooks/useAdmin";

jest.mock("@/hooks/useAdmin", () => ({
  useAlerts: jest.fn(),
  useModerationQueue: jest.fn(),
  usePlatformAnalytics: jest.fn(),
  useResolveAlert: jest.fn(),
  useResolveModerationReport: jest.fn(),
}));

const queue = useModerationQueue as jest.Mock;
const resolveReport = useResolveModerationReport as jest.Mock;
const alerts = useAlerts as jest.Mock;
const resolveAlert = useResolveAlert as jest.Mock;
const analytics = usePlatformAnalytics as jest.Mock;

const report = {
  id: "r1",
  postId: "p1",
  reason: "Harassment",
  createdAt: "2030-01-15T09:00:00.000Z",
};
const idle = { data: undefined, isLoading: false, isError: false, error: null };
const page = (reports: unknown[]) => ({ reports, total: reports.length, page: 1, limit: 50 });

beforeEach(() => {
  resolveReport.mockReturnValue({ mutate: jest.fn(), isPending: false });
  resolveAlert.mockReturnValue({ mutate: jest.fn(), isPending: false });
});

describe("AdminModerationPage", () => {
  it("renders the reports returned by the queue", () => {
    queue.mockReturnValue({ ...idle, data: page([report]) });
    render(<AdminModerationPage />);
    expect(screen.getByText("Harassment")).toBeInTheDocument();
    expect(screen.getByText(/Post p1/)).toBeInTheDocument();
    expect(screen.queryByText("No pending reports.")).not.toBeInTheDocument();
  });

  it("resolves a report with the typed reason", async () => {
    const mutate = jest.fn();
    resolveReport.mockReturnValue({ mutate, isPending: false });
    queue.mockReturnValue({ ...idle, data: page([report]) });
    const user = userEvent.setup();
    render(<AdminModerationPage />);
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeDisabled();
    await user.type(screen.getByLabelText(/Decision reason/), "Not a violation");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(mutate).toHaveBeenCalledWith({
      id: "r1",
      decision: "DISMISSED",
      reason: "Not a violation",
    });
  });

  it("shows the empty state", () => {
    queue.mockReturnValue({ ...idle, data: page([]) });
    render(<AdminModerationPage />);
    expect(screen.getByText("No pending reports.")).toBeInTheDocument();
  });

  it("shows the loading state", () => {
    queue.mockReturnValue({ ...idle, isLoading: true });
    render(<AdminModerationPage />);
    expect(screen.getByText(/Loading moderation queue/)).toBeInTheDocument();
  });

  it("shows the error state, not the empty state", () => {
    queue.mockReturnValue({ ...idle, isError: true, error: new ApiError("boom", 500) });
    render(<AdminModerationPage />);
    expect(screen.getByText("Moderation is unavailable")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.queryByText("No pending reports.")).not.toBeInTheDocument();
  });
});

describe("AdminAlertsPage", () => {
  it("shows an error without also claiming there are no alerts", () => {
    alerts.mockReturnValue({ ...idle, isError: true });
    render(<AdminAlertsPage />);
    expect(screen.getByText("Could not load alerts.")).toBeInTheDocument();
    expect(screen.queryByText("No unresolved alerts.")).not.toBeInTheDocument();
  });

  it("shows the empty state", () => {
    alerts.mockReturnValue({ ...idle, data: { alerts: [], total: 0, page: 1, limit: 50 } });
    render(<AdminAlertsPage />);
    expect(screen.getByText("No unresolved alerts.")).toBeInTheDocument();
  });
});

describe("AdminOverviewPage", () => {
  it("shows 9 skeleton tiles while loading", () => {
    analytics.mockReturnValue({ ...idle, isLoading: true });
    const { container } = render(<AdminOverviewPage />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(9);
  });

  it("shows the error banner and no misleading stat tiles", () => {
    analytics.mockReturnValue({ ...idle, isError: true });
    render(<AdminOverviewPage />);
    expect(screen.getByText("Could not load platform analytics.")).toBeInTheDocument();
    expect(screen.queryByText("Total users")).not.toBeInTheDocument();
  });
});
