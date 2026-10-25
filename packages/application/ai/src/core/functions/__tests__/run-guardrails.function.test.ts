/**
 * Stackra file contract:
 * Purpose: unit tests of `runGuardrails`: layers run in order with the text and stage, the first block wins and later
 *          layers do not run, and a throwing layer rejects.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { runGuardrails } from "#core/functions/run-guardrails.function";
import type { Guardrail } from "#core/types/guardrail.type";

const passing = (name: string): Guardrail => ({
  name,
  check: vi.fn(() => ({ pass: true as const })),
});

describe("runGuardrails", () => {
  it("passes when every layer passes", async () => {
    const first = passing("first");
    expect(await runGuardrails([first, passing("second")], "hi", "input")).toEqual({ pass: true });
    expect(first.check).toHaveBeenCalledWith("hi", "input");
  });

  it("stops at the first layer that blocks", async () => {
    const later = passing("later");
    const blocking: Guardrail = {
      name: "policy",
      check: async () => ({ pass: false, reason: "off_topic" }),
    };
    expect(await runGuardrails([passing("a"), blocking, later], "x", "output")).toEqual({
      pass: false,
      guardrail: "policy",
      reason: "off_topic",
    });
    expect(later.check).not.toHaveBeenCalled();
  });

  it("rejects when a layer throws", async () => {
    const broken: Guardrail = {
      name: "broken",
      check: () => {
        throw new Error("down");
      },
    };
    await expect(runGuardrails([broken], "x", "input")).rejects.toThrow("down");
  });
});
