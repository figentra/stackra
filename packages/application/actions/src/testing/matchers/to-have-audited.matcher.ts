/**
 * Stackra file contract:
 * Purpose: `toHaveAudited`, the matcher `expect(result).toHaveAudited({ outcome, code, fields })` over a `RunResult`:
 *          the call wrote an audit entry with that outcome, refusal code and `ctx.audit` fields.
 * Boundary: a domain matcher owned by this package (ADR 0269 decision 3); importing the `./testing` entry registers
 *           it. It reads `RunResult.audit` (the entry the testing pipeline recorded for that call), so a test no longer
 *           digs `audit_entry.recorded` events out of the outbox. With no expectation it asserts only that an entry
 *           exists; it fails on anything that is not a `run(...)` result.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0212 (decision 4); STA-820.
 */
import { isDeepStrictEqual } from "node:util";

import { createMatcher } from "@stackra/testing";

import type { AuditEntry } from "#contracts/index";
import type { AuditExpectation } from "#testing/types/audit-expectation.type";

/** The parts of `entry` that differ from `expected`, by name. */
function mismatches(entry: AuditEntry, expected: AuditExpectation): string[] {
  const out: string[] = [];
  if (expected.outcome !== undefined && entry.outcome !== expected.outcome)
    out.push(`outcome ${entry.outcome}`);
  if (expected.code !== undefined && entry.code !== expected.code)
    out.push(`code ${String(entry.code)}`);
  for (const [name, value] of Object.entries(expected.fields ?? {}))
    if (!isDeepStrictEqual(entry.fields[name], value))
      out.push(`fields.${name} ${JSON.stringify(entry.fields[name])}`);
  return out;
}

/**
 * Passes when the run's call wrote an audit entry matching `expected`.
 *
 * @example
 * const placed = await run(CreateOrderAction, input, { as: actors.customer() });
 * expect(placed).toHaveAudited({ outcome: "ok", fields: { orderId: placed.output.orderId } });
 */
export const toHaveAudited = createMatcher(
  "toHaveAudited",
  (result: unknown, expected: AuditExpectation = {}) => {
    const holder = result as { readonly audit?: AuditEntry } | null | undefined;
    const isRun = typeof holder === "object" && holder !== null && "audit" in holder;
    const entry = isRun ? holder.audit : undefined;
    const wrong = entry === undefined ? [] : mismatches(entry, expected);
    const pass = entry !== undefined && wrong.length === 0;
    return {
      pass,
      message: () =>
        !isRun
          ? "expected the result of run(...)"
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
    /** Asserts that the run's call wrote an audit entry matching the expectation. */
    toHaveAudited(expected?: AuditExpectation): R;
  }
}
