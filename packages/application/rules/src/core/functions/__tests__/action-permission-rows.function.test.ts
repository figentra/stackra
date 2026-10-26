/**
 * Stackra file contract:
 * Purpose: unit tests of `actionPermissionRowsOf`: a bare row, a row narrowed by role, record kind, record id and data
 *          class, the approver rule with its safe defaults, and the refusals (an unknown state, a record id without a
 *          kind, not an array).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0398 (decisions 1 and 6); STA-1250.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";
import { actionPermissionRowsOf } from "#core/functions/action-permission-rows.function";

/** A row outcome with `params`. */
const row = (params: Record<string, string>) => ({ kind: "row", params });

describe("actionPermissionRowsOf", () => {
  it("reads a bare row and a narrowed one", () => {
    expect(
      actionPermissionRowsOf([
        row({ action: "orders.order.cancel@1", state: "on_its_own" }),
        row({
          action: "legal.claim.file@1",
          state: "off",
          role: "associate",
          recordKind: "matter",
          recordId: "mat_01",
          dataClass: "privileged",
        }),
      ]),
    ).toEqual([
      { action: "orders.order.cancel@1", state: "on_its_own" },
      {
        action: "legal.claim.file@1",
        state: "off",
        role: "associate",
        record: { kind: "matter", id: "mat_01" },
        dataClass: "privileged",
      },
    ]);
  });

  it("names an approver rule with not-requester on and step-up off unless the row says otherwise", () => {
    const [lawyer, strict, open] = actionPermissionRowsOf([
      row({ action: "legal.claim.file@1", state: "after_approval", seatKind: "lawyer" }),
      row({
        action: "legal.claim.file@1",
        state: "after_approval",
        stepUp: "yes",
        recordKind: "matter",
      }),
      row({ action: "legal.claim.file@1", state: "after_approval", notRequester: "no" }),
    ]);
    expect(lawyer?.approver).toEqual({ seatKind: "lawyer", notRequester: true, stepUp: false });
    expect(strict).toEqual({
      action: "legal.claim.file@1",
      state: "after_approval",
      record: { kind: "matter" },
      approver: { notRequester: true, stepUp: true },
    });
    expect(open?.approver).toEqual({ notRequester: false, stepUp: false });
  });

  it("refuses a row it cannot read", () => {
    for (const outcomes of [
      [row({ action: "a.b.c@1", state: "sometimes" })],
      [row({ action: "a.b.c@1", state: "off", recordId: "mat_01" })],
      { kind: "row" },
    ]) {
      const refused = (() => {
        try {
          return actionPermissionRowsOf(outcomes);
        } catch (error) {
          return error;
        }
      })();
      expect(isRefusal(refused, OutcomeInvalidError)).toBe(true);
    }
  });
});
