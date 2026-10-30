/**
 * Stackra file contract:
 * Purpose: proves `useDashboardLayout()`: with no port it keeps the defaults and changes in memory; with one it shows
 *          the defaults, then the saved layout reconciled with them (unknown tiles dropped, new ones added); a change
 *          is shown at once and saved; a load that arrives after the reader's change, after unmount, or that fails
 *          never overwrites what is shown; a failed save is swallowed.
 * Boundary: the hook through `renderHook` in jsdom, over a port whose load the test settles.
 * Runtime: browser
 * Governing contract: ADR 0307 (decisions 16 and 18); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import type { DashboardLayoutPort } from "#contracts/types/dashboard-layout-port.type";
import { useDashboardLayout } from "#react/hooks/use-dashboard-layout";

const DEFAULTS: DashboardLayout = [
  { id: "sales", size: "medium" },
  { id: "orders", size: "medium" },
];

/** A port whose load the test resolves or rejects by hand. */
function manualPort(save: DashboardLayoutPort["save"] = vi.fn(() => Promise.resolve())) {
  let settle: { resolve: (layout: unknown) => void; reject: (error: Error) => void } | undefined;
  const port: DashboardLayoutPort = {
    load: () =>
      new Promise((resolve, reject) => {
        settle = { resolve: resolve as (layout: unknown) => void, reject };
      }),
    save,
  };
  return {
    port,
    save,
    resolve: async (layout: unknown) => act(async () => settle?.resolve(layout)),
    reject: async () => act(async () => settle?.reject(new Error("offline"))),
  };
}

describe("useDashboardLayout (web)", () => {
  it("keeps the defaults and changes in memory with no port", () => {
    const { result } = renderHook(() => useDashboardLayout(undefined, DEFAULTS));
    expect(result.current[0]).toBe(DEFAULTS);
    const next: DashboardLayout = [{ id: "orders", size: "full" }];
    act(() => result.current[1](next));
    expect(result.current[0]).toBe(next);
  });

  it("shows the defaults, then the saved layout reconciled with them", async () => {
    const { port, resolve } = manualPort();
    const { result } = renderHook(() => useDashboardLayout(port, DEFAULTS));
    expect(result.current[0]).toBe(DEFAULTS);
    await resolve([
      { id: "orders", size: "large" },
      { id: "retired", size: "small" },
    ]);
    expect(result.current[0]).toEqual([
      { id: "orders", size: "large" },
      { id: "sales", size: "medium" },
    ]);
  });

  it("shows and saves a change, and a late load never overwrites it", async () => {
    const { port, save, resolve } = manualPort();
    const { result } = renderHook(() => useDashboardLayout(port, DEFAULTS));
    const next: DashboardLayout = [
      { id: "orders", size: "small" },
      { id: "sales", size: "full" },
    ];
    act(() => result.current[1](next));
    expect(result.current[0]).toBe(next);
    expect(save).toHaveBeenCalledWith(next);
    await resolve([{ id: "sales", size: "small" }]);
    expect(result.current[0]).toBe(next);
  });

  it("keeps the defaults when the load fails, finds nothing, or arrives after unmount", async () => {
    const failing = manualPort();
    const failed = renderHook(() => useDashboardLayout(failing.port, DEFAULTS));
    await failing.reject();
    expect(failed.result.current[0]).toBe(DEFAULTS);

    const empty = manualPort();
    const none = renderHook(() => useDashboardLayout(empty.port, DEFAULTS));
    await empty.resolve(null);
    expect(none.result.current[0]).toBe(DEFAULTS);

    const late = manualPort();
    const gone = renderHook(() => useDashboardLayout(late.port, DEFAULTS));
    gone.unmount();
    await late.resolve([{ id: "sales", size: "full" }]);
    expect(gone.result.current[0]).toBe(DEFAULTS);
  });

  it("swallows a failed save and keeps the change on screen", async () => {
    const { port } = manualPort(() => Promise.reject(new Error("quota")));
    const { result } = renderHook(() => useDashboardLayout(port, DEFAULTS));
    const next: DashboardLayout = [{ id: "sales", size: "small" }];
    await act(async () => result.current[1](next));
    expect(result.current[0]).toBe(next);
  });
});
