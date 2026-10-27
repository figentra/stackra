// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `useAppApprovalSheet`: it loads the pending prompts on mount; `approve` runs the biometric
 *          check first and sends nothing when it is refused; an answer reloads the list; `scan` puts the redeemed
 *          prompt first; a failed call is kept as the error.
 * Boundary: test only; the hook is plain React, rendered through Testing Library (jsdom).
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; STA-1304.
 */
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { AppApprovalPrompt } from "#core/index";
import { useAppApprovalSheet } from "#native/app-approval/use-app-approval-sheet";

/** A pending prompt with `id`. */
const promptOf = (id: string): AppApprovalPrompt => ({
  id,
  purpose: "sign_in",
  requester: { device: "laptop", ip: "203.0.113.7", location: "Riyadh, SA", userAgent: "Firefox" },
  choices: [12, 47, 88, 30],
  createdAt: new Date("2026-10-27T09:00:00Z"),
  expiresAt: new Date("2026-10-27T09:01:00Z"),
});

/** The calls, over a mutable list. */
function callsOver(list: AppApprovalPrompt[], verified = true) {
  return {
    load: vi.fn(async () => [...list]),
    approve: vi.fn(async (id: string) => {
      list.splice(
        list.findIndex((prompt) => prompt.id === id),
        1,
      );
      return true;
    }),
    deny: vi.fn(async (id: string) => {
      list.splice(
        list.findIndex((prompt) => prompt.id === id),
        1,
      );
    }),
    redeem: vi.fn(async (token: string) => promptOf(`qr-${token}`)),
    verify: vi.fn(async () => verified),
  };
}

describe("useAppApprovalSheet", () => {
  it("loads the prompts, approves after the check and reloads", async () => {
    const calls = callsOver([promptOf("c1"), promptOf("c2")]);
    const { result } = renderHook(() => useAppApprovalSheet(calls));
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    expect(result.current.prompts[0]?.requester.location).toBe("Riyadh, SA");
    let approved = false;
    await act(async () => {
      approved = await result.current.approve("c1", 47);
    });
    expect(approved).toBe(true);
    expect(calls.verify).toHaveBeenCalledOnce();
    expect(calls.approve).toHaveBeenCalledWith("c1", 47);
    expect(result.current.prompts.map((prompt) => prompt.id)).toEqual(["c2"]);
    await act(async () => {
      await result.current.deny("c2");
    });
    expect(result.current.prompts).toEqual([]);
  });

  it("sends nothing when the biometric check is refused", async () => {
    const calls = callsOver([promptOf("c1")], false);
    const { result } = renderHook(() => useAppApprovalSheet(calls));
    await waitFor(() => expect(result.current.prompts).toHaveLength(1));
    await act(async () => {
      expect(await result.current.approve("c1", 47)).toBe(false);
    });
    expect(calls.approve).not.toHaveBeenCalled();
  });

  it("puts a scanned prompt first and keeps a failure as the error", async () => {
    const calls = callsOver([promptOf("c1")]);
    const { result } = renderHook(() => useAppApprovalSheet(calls));
    await waitFor(() => expect(result.current.prompts).toHaveLength(1));
    await act(async () => {
      await result.current.scan("t");
    });
    expect(result.current.prompts.map((prompt) => prompt.id)).toEqual(["qr-t", "c1"]);
    const failure = new Error("offline");
    calls.deny.mockRejectedValueOnce(failure);
    await act(async () => {
      await result.current.deny("c1");
    });
    expect(result.current.error).toBe(failure);
  });
});
