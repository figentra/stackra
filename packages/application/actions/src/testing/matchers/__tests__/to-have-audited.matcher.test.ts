/**
 * Stackra file contract:
 * Purpose: unit tests of `toHaveAudited`: it passes on a run result whose audit entry matches the outcome, code and a
 *          subset of fields (deep equality), fails on a mismatch, on a result with no entry and on anything that is
 *          not a run result, and `.not` inverts it; over a fake context it matches the fields passed to `ctx.audit`
 *          (STA-1248).
 * Boundary: test only; the results are built by hand, so no app is compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); STA-820.
 */
import { type Actor, ActorKind, ApiArea, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import type { SyncMatcherResult } from "vitest";

import type { AuditEntry } from "#contracts/index";
import { fakeActionContext } from "#testing/functions/fake-action-context.function";
import { toHaveAudited } from "#testing/matchers/to-have-audited.matcher";

const actor: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

const entry: AuditEntry = {
  call: {
    callId: "call_1",
    type: class {},
    kind: "action",
    key: "order.place",
    actor,
    area: ApiArea.App,
  },
  at: new Date("2026-10-26T00:00:00Z"),
  outcome: "refused",
  code: "out_of_stock",
  fields: { sku: "kettle", lines: [{ qty: 2 }] },
};

/** The matcher's answer, which is synchronous. */
function verdict(...args: Parameters<typeof toHaveAudited>): SyncMatcherResult {
  return toHaveAudited(...args) as SyncMatcherResult;
}

describe(toHaveAudited, () => {
  it("matches the outcome, the code and a subset of fields", () => {
    expect({ audit: entry }).toHaveAudited();
    expect({ audit: entry }).toHaveAudited({
      outcome: "refused",
      code: "out_of_stock",
      fields: { lines: [{ qty: 2 }] },
    });
    expect({ audit: entry }).not.toHaveAudited({ outcome: "ok" });
    expect({ audit: entry }).not.toHaveAudited({ fields: { lines: [{ qty: 3 }] } });
  });

  it("fails with no entry or on anything but a run result", () => {
    expect(verdict({ audit: undefined }, {}).pass).toBe(false);
    expect(verdict({ audit: undefined }, {}).message()).toMatch(/wrote none/);
    expect(verdict(42, {}).message()).toMatch(/run\(\.\.\.\)/);
    expect(verdict({ audit: entry }, { code: "x" }).message()).toMatch(/code out_of_stock/);
  });

  it("matches the fields a fake context recorded, and never an outcome", () => {
    const ctx = fakeActionContext({ actor });
    expect(ctx).not.toHaveAudited();
    expect(verdict(ctx, {}).message()).toMatch(/wrote none/);
    ctx.audit({ tenantId: "tnt_1", reenabled: ["orders"] });
    expect(ctx).toHaveAudited({ fields: { reenabled: ["orders"] } });
    expect(ctx).not.toHaveAudited({ fields: { tenantId: "tnt_2" } });
    expect(ctx).not.toHaveAudited({ outcome: "ok" });
  });
});
