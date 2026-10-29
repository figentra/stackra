/**
 * Stackra file contract:
 * Purpose: unit tests of `useAccountDeletion`: it loads the scheduled date on mount, `request` shows the new date,
 *          `cancel` clears it, and a refused request keeps the state and exposes the error.
 * Boundary: test only; Testing Library (jsdom).
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; STA-1567.
 */
// @vitest-environment jsdom
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { useAccountDeletion } from "#react/account-deletion/use-account-deletion";

const NONE = { requestedAt: null, dueAt: null };
const SCHEDULED = { requestedAt: "2026-10-29T09:00:00.000Z", dueAt: "2026-11-28T09:00:00.000Z" };

describe("useAccountDeletion", () => {
  it("loads, requests and cancels", async () => {
    const options = {
      load: vi.fn(async () => NONE),
      request: vi.fn(async () => SCHEDULED),
      cancel: vi.fn(async () => NONE),
    };
    const { result } = renderHook(() => useAccountDeletion(options));
    await waitFor(() => expect(options.load).toHaveBeenCalledOnce());
    expect(result.current.dueAt).toBeNull();
    await act(async () => {
      expect(await result.current.request()).toBe(true);
    });
    expect(result.current.dueAt).toBe(SCHEDULED.dueAt);
    await act(async () => {
      await result.current.cancel();
    });
    expect(result.current).toMatchObject({ dueAt: null, busy: false, error: undefined });
  });

  it("keeps the state and exposes a refused request", async () => {
    const refusal = new Error("step_up_required");
    const { result } = renderHook(() =>
      useAccountDeletion({
        load: async () => NONE,
        request: () => Promise.reject(refusal),
        cancel: async () => NONE,
      }),
    );
    await act(async () => {
      expect(await result.current.request()).toBe(false);
    });
    expect(result.current).toMatchObject({ dueAt: null, error: refusal });
  });
});
