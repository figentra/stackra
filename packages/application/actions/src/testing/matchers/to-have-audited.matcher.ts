/**
 * Stackra file contract:
 * Purpose: `toHaveAudited`, the matcher `expect(result).toHaveAudited({ outcome, code, fields })` over a `RunResult`:
 *          the call wrote an audit entry with that outcome, refusal code and `ctx.audit` fields; and
 *          `expect(ctx).toHaveAudited({ fields })` over a `fakeActionContext()`: the code under test passed those
 *          fields to `ctx.audit` (STA-1248).
 * Boundary: a domain matcher owned by this package (ADR 0269 decision 3); importing the `./testing` entry registers
 *           it. It reads `RunResult.audit` (the entry the testing pipeline recorded for that call), so a test no longer
 *           digs `audit_entry.recorded` events out of the outbox. With no expectation it asserts only that an entry
 *           exists; it fails on anything that is neither a `run(...)` result nor a fake context. A fake context runs no
 *           pipeline, so it has fields only: it counts as audited once `ctx.audit` was called, and an expected
 *           `outcome` or `code` never matches it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0212 (decision 4); STA-820; STA-1248.
 */
import { isDeepStrictEqual } from "node:util";

import { createMatcher } from "@stackra/testing";

import type { AuditEntry } from "#contracts/index";
import type { AuditExpectation } from "#testing/types/audit-expectation.type";
import type { FakeActionContext } from "#testing/types/fake-action-context.type";

/** What the matcher reads: a run's entry, or a fake context's recorded fields as an entry with no outcome. */
function entryOf(value: unknown): {
  readonly known: boolean;
  readonly entry?: Partial<AuditEntry> | undefined;
} {
  if (typeof value !== "object" || value === null) return { known: false };
  if ("audit" in value && !("recorded" in value))
    return { known: true, entry: (value as { readonly audit?: AuditEntry }).audit };
  if ("recorded" in value) {
    const fields = (value as FakeActionContext).recorded.audit;
    return { known: true, ...(Object.keys(fields).length === 0 ? {} : { entry: { fields } }) };
  }
  return { known: false };
}

/** The parts of `entry` that differ from `expected`, by name. */
function mismatches(entry: Partial<AuditEntry>, expected: AuditExpectation): string[] {
  const out: string[] = [];
  if (expected.outcome !== undefined && entry.outcome !== expected.outcome)
    out.push(`outcome ${String(entry.outcome)}`);
  if (expected.code !== undefined && entry.code !== expected.code)
    out.push(`code ${String(entry.code)}`);
  for (const [name, value] of Object.entries(expected.fields ?? {}))
    if (!isDeepStrictEqual(entry.fields?.[name], value))
      out.push(`fields.${name} ${JSON.stringify(entry.fields?.[name])}`);
  return out;
}

/**
 * Passes when the run's call wrote an audit entry matching `expected`.
 *
 * @example
 * const placed = await run(CreateOrderAction, input, { as: actors.customer() });
 * expect(placed).toHaveAudited({ outcome: "ok", fields: { orderId: placed.output.orderId } });
 *
 * const ctx = fakeActionContext();
 * await service.reenable(scopeId, ctx);
 * expect(ctx).toHaveAudited({ fields: { scopeId } });
 */
export const toHaveAudited = createMatcher(
  "toHaveAudited",
  (result: unknown, expected: AuditExpectation = {}) => {
    const { known: isRun, entry } = entryOf(result);
    const wrong = entry === undefined ? [] : mismatches(entry, expected);
    const pass = entry !== undefined && wrong.length === 0;
    return {
      pass,
      message: () =>
        !isRun
          ? "expected the result of run(...) or a fakeActionContext()"
          : entry === undefined
            ? "expected the call to write an audit entry, and it wrote none"
            : pass
              ? `expected no audit entry matching ${JSON.stringify(expected)}`
              : `expected an audit entry matching ${JSON.stringify(expected)}, but got ${wrong.join(", ")}`,
    };
  },
);

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Asserts that the run's call (or the fake context's code under test) wrote audit fields matching the expectation. */
    toHaveAudited(expected?: AuditExpectation): R;
  }
}
