/**
 * Stackra file contract:
 * Purpose: unit tests of `toolHints`: read-only from L0 and L1, destructive from L4 or `irreversible`, idempotent for a
 *          query or a declared idempotency, open-world from `external_communication`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0099 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { toolHints } from "#core/functions/tool-hints.function";

describe("toolHints", () => {
  it("marks a read as read-only and idempotent", () => {
    expect(toolHints({ kind: "query", risk: "L1", effects: [], idempotent: false })).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
  });

  it("marks L4 or an irreversible effect as destructive", () => {
    expect(
      toolHints({ kind: "action", risk: "L4", effects: [], idempotent: false }).destructiveHint,
    ).toBe(true);
    expect(
      toolHints({ kind: "action", risk: "L2", effects: ["irreversible"], idempotent: false })
        .destructiveHint,
    ).toBe(true);
  });

  it("follows idempotency and external communication on an action", () => {
    const hints = toolHints({
      kind: "action",
      risk: "L2",
      effects: ["external_communication"],
      idempotent: true,
    });
    expect(hints).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    });
  });
});
