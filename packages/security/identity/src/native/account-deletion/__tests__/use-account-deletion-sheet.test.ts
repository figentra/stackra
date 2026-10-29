/**
 * Stackra file contract:
 * Purpose: unit tests of `useAccountDeletionSheet`: a refused device check sends nothing; a passed one schedules the
 *          deletion and shows its date.
 * Boundary: test only; Testing Library (jsdom) stands in for React Native, as the hook renders nothing.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; STA-1567.
 */
// @vitest-environment jsdom
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useAccountDeletionSheet } from "#native/account-deletion/use-account-deletion-sheet";

const NONE = { requestedAt: null, dueAt: null };
const SCHEDULED = { requestedAt: "2026-10-29T09:00:00.000Z", dueAt: "2026-11-28T09:00:00.000Z" };

describe("useAccountDeletionSheet", () => {
  it("asks the device first and sends nothing when it refuses", async () => {
    const request = vi.fn(async () => SCHEDULED);
    const verify = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = renderHook(() =>
      useAccountDeletionSheet({
        load: async () => NONE,
        request,
        cancel: async () => NONE,
        verify,
      }),
    );
    await act(async () => {
      expect(await result.current.request()).toBe(false);
    });
    expect(request).not.toHaveBeenCalled();
    await act(async () => {
      expect(await result.current.request()).toBe(true);
    });
    expect(result.current.dueAt).toBe(SCHEDULED.dueAt);
  });
});
