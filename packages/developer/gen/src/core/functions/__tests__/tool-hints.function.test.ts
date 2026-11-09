/**
 * Stackra file contract:
 * Purpose: unit tests of `toolHints`: read-only for a query at L0 or L1, destructive from L4 or
 *          `irreversible`, idempotent for a query or an action whose key is required or derived (never for optional or never), open-world from `external_communication`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0099 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { toolHints } from "#core/functions/tool-hints.function";

/** The idempotent hint of an L2 action with this written `idempotency`. */
const hint = (idempotency: unknown): boolean =>
  toolHints({ kind: "action", risk: "L2", effects: [], idempotency }).idempotentHint;

describe("toolHints", () => {
  it("marks a read as read-only and idempotent", () => {
    expect(toolHints({ kind: "query", risk: "L1", effects: [], idempotency: undefined })).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
  });

  it("never marks an action as read-only, even at L0 or L1", () => {
    expect(
      toolHints({ kind: "action", risk: "L1", effects: [], idempotency: undefined }).readOnlyHint,
    ).toBe(false);
    expect(
      toolHints({ kind: "action", risk: "L0", effects: [], idempotency: undefined }).readOnlyHint,
    ).toBe(false);
  });

  it("marks L4 or an irreversible effect as destructive", () => {
    expect(
      toolHints({ kind: "action", risk: "L4", effects: [], idempotency: undefined })
        .destructiveHint,
    ).toBe(true);
    expect(
      toolHints({ kind: "action", risk: "L2", effects: ["irreversible"], idempotency: undefined })
        .destructiveHint,
    ).toBe(true);
  });

  it("follows idempotency and external communication on an action", () => {
    const hints = toolHints({
      kind: "action",
      risk: "L2",
      effects: ["external_communication"],
      idempotency: "required",
    });
    expect(hints).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    });
  });

  it("marks an action idempotent only when a repeat cannot run twice", () => {
    expect(hint("required")).toBe(true);
    expect(hint("derived")).toBe(true);
    // Optional runs a call without a key every time; never ignores the key.
    expect(hint("optional")).toBe(false);
    expect(hint("never")).toBe(false);
    expect(hint(undefined)).toBe(false);
  });
});
