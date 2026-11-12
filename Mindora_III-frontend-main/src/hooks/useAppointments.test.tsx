import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useCompleteAppointment,
  useConfirmAppointment,
  usePatientName,
} from "@/hooks/useAppointments";
import {
  completeAppointment,
  confirmAppointment,
  fetchTherapistPatients,
} from "@/lib/appointments-api";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/appointments-api", () => ({
  completeAppointment: jest.fn(),
  confirmAppointment: jest.fn(),
  fetchTherapistPatients: jest.fn(),
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = jest.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { spy, wrapper };
}

const invalidated = (spy: jest.SpyInstance) =>
  spy.mock.calls.map(([filters]) => (filters as { queryKey: string[] }).queryKey.join("/"));

describe("therapist cache invalidation", () => {
  it.each([
    ["confirm", useConfirmAppointment, confirmAppointment],
    ["complete", useCompleteAppointment, completeAppointment],
  ])("%s refreshes schedule, dashboard and patients", async (_name, hook, api) => {
    (api as jest.Mock).mockResolvedValue({});
    const { spy, wrapper } = setup();
    const { result } = renderHook(() => hook(), { wrapper });
    await act(async () => {
      result.current.mutate("a1");
    });
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(invalidated(spy)).toEqual(
      expect.arrayContaining([
        "appointments/schedule",
        "appointments/dashboard",
        "appointments/patients",
      ])
    );
  });
});

describe("usePatientName", () => {
  it("resolves names from the patients list and falls back to a short id", async () => {
    (fetchTherapistPatients as jest.Mock).mockResolvedValue({
      patients: [
        { patientId: "p1", userName: "Amina Uwase", totalSessions: 1, lastSessionAt: null },
      ],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { wrapper } = setup();
    const { result } = renderHook(() => usePatientName(), { wrapper });
    expect(result.current("abcdefghij")).toBe("Patient abcdefgh");
    await waitFor(() => expect(result.current("p1")).toBe("Amina Uwase"));
    expect(result.current("abcdefghij")).toBe("Patient abcdefgh");
  });
});
