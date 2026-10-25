/**
 * Stackra file contract:
 * Purpose: `fakeActionContext(overrides?)`, the context a unit test hands a service or extension that takes an
 *          `ActionContext`, without running the pipeline: `authorize` allows, `afterCommit` work and `audit` fields are
 *          recorded, and `period`, `startOfDay` and `now` work on a clock frozen at creation.
 * Boundary: test only. `run`, `signal`, `dispatch` and `replica` reject with a message unless the test passes its own;
 *           a test that needs the real steps uses `run(...)` instead. Overrides replace members whole.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0136 (consequence: handlers are testable with a fake ctx).
 */
import type { Json } from "@stackra/contracts";

import type { ActionContext, PeriodInput } from "#core/index";
import { periodOf } from "#core/functions/period-of.function";
import { startOfZonedDay } from "#core/functions/start-of-zoned-day.function";
import { fakeExtensionContext } from "#testing/functions/fake-extension-context.function";
import type { FakeActionContext } from "#testing/types/fake-action-context.type";

/** Rejects a capability a fake context does not have. */
const missing = (member: string) => () =>
  Promise.reject(
    new Error(
      `fakeActionContext has no ${member}: pass { ${member} } or call the action with run() from @stackra/actions/testing`,
    ),
  );

/**
 * An action context for a unit test.
 *
 * @example
 * const ctx = fakeActionContext({ actor: actors.customer() });
 * const totals = await service.price(await service.draft(input, ctx), ctx);
 * expect(ctx.recorded.afterCommit).toHaveLength(0);
 */
export function fakeActionContext(overrides: Partial<ActionContext> = {}): FakeActionContext {
  const base = fakeExtensionContext(overrides);
  const at = base.now();
  const authorized: object[] = [];
  const afterCommit: (() => unknown)[] = [];
  const audit: Record<string, Json> = {};
  return Object.freeze({
    ...base,
    idempotencyKey: undefined,
    authorize: async (record: object) => {
      authorized.push(record);
    },
    period: (input: PeriodInput) => periodOf(input, at, base.timeZone),
    startOfDay: () => startOfZonedDay(at, base.timeZone),
    afterCommit: (work: () => unknown) => {
      afterCommit.push(work);
    },
    audit: (fields: Readonly<Record<string, Json>>) => {
      Object.assign(audit, fields);
    },
    run: missing("run"),
    signal: missing("signal"),
    dispatch: missing("dispatch"),
    replica: missing("replica"),
    ...overrides,
    recorded: Object.freeze({ authorized, afterCommit, audit }),
  });
}
