/**
 * Stackra file contract:
 * Purpose: proves useTamo answers the slot only where it is on and wanted, and useTamoTask runs, stops and retries a task.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";
import { useTamo } from "#react/hooks/use-tamo";
import { useTamoTask } from "#react/hooks/use-tamo-task";

/** A slot that answers every task with `answer` (or never, with `pending`). */
function slotOf(run: TamoSlot["run"], overrides: Partial<TamoSlot> = {}): TamoSlot {
  return {
    isEnabled: () => true,
    run,
    panel: { isOpen: false, question: undefined, open: vi.fn(), close: vi.fn() },
    ...overrides,
  };
}

describe("useTamo", () => {
  it("is null without a slot, off, or unwanted", () => {
    const off = slotOf(vi.fn(), { isEnabled: ({ field }) => field !== "secret" });
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <TamoContext.Provider value={off}>{children}</TamoContext.Provider>
    );
    expect(renderHook(() => useTamo()).result.current).toBeNull();
    expect(renderHook(() => useTamo({ field: "note" }), { wrapper }).result.current).toBe(off);
    expect(renderHook(() => useTamo({ field: "secret" }), { wrapper }).result.current).toBeNull();
    expect(renderHook(() => useTamo({}, false), { wrapper }).result.current).toBeNull();
  });
});

describe("useTamoTask", () => {
  it("runs to ready, stops back to idle and retries the last job", async () => {
    const { result } = renderHook(() => useTamoTask<string>());
    const job = vi.fn(async () => "done");
    act(() => result.current.run(job));
    expect(result.current.status).toBe("working");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.result).toBe("done");
    act(() =>
      result.current.run(
        () =>
          new Promise<string>(() => {
            // never settles
          }),
      ),
    );
    act(() => result.current.stop());
    expect(result.current.status).toBe("idle");
    act(() => result.current.retry());
    expect(result.current.status).toBe("working");
  });

  it("keeps the error of a failed job", async () => {
    const { result } = renderHook(() => useTamoTask<string>());
    act(() =>
      result.current.run(async () => {
        throw new Error("down");
      }),
    );
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
