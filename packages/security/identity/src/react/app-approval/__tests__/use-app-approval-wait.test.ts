// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `useAppApprovalWait`: it starts a challenge and shows its ticket, polls until the app
 *          answers and stops there, ends at the ticket's expiry, fails with the error of a failed call, and
 *          `restart` asks again.
 * Boundary: test only; Testing Library (jsdom) with fake timers.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; STA-1304.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";

import type { AppApprovalProgress, AppApprovalTicket } from "#core/index";
import { useAppApprovalWait } from "#react/app-approval/use-app-approval-wait";

/** A ticket lapsing `seconds` from the fake now. */
const ticketFor = (seconds = 60): AppApprovalTicket => ({
  id: "c1",
  pollSecret: "s",
  number: 47,
  qrToken: "q",
  expiresAt: new Date(Date.now() + seconds * 1000),
});

describe("useAppApprovalWait", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the number, polls while pending and stops on approval", async () => {
    const answers: AppApprovalProgress[] = ["pending", "approved"];
    const poll = vi.fn(async () => answers.shift() ?? "ended");
    const { result } = renderHook(() =>
      useAppApprovalWait({ start: async () => ticketFor(), poll, intervalMs: 1000 }),
    );
    expect(result.current.phase).toBe("starting");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.phase).toBe("pending");
    expect(result.current.ticket?.number).toBe(47);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(result.current.phase).toBe("approved");
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("ends at the ticket's expiry without asking again", async () => {
    const poll = vi.fn(async (): Promise<AppApprovalProgress> => "pending");
    const { result } = renderHook(() =>
      useAppApprovalWait({ start: async () => ticketFor(3), poll, intervalMs: 1000 }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(result.current.phase).toBe("ended");
    expect(poll.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it("fails with the error of a failed call, and restarts with a fresh challenge", async () => {
    const failure = new Error("offline");
    const start = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue(ticketFor());
    const { result } = renderHook(() =>
      useAppApprovalWait({ start, poll: async () => "pending", intervalMs: 1000 }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toMatchObject({ phase: "failed", error: failure });
    await act(async () => {
      result.current.restart();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.phase).toBe("pending");
    expect(start).toHaveBeenCalledTimes(2);
  });
});
