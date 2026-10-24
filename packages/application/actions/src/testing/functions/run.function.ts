/**
 * Stackra file contract:
 * Purpose: `run(Class, input, { as, idempotencyKey })`, the one way a test calls an action or query: through the real
 *          pipeline of the testing app compiled last, as the given actor, resolving to a `RunResult` with the output or
 *          the refusal and the events published during the call.
 * Boundary: test only. Every step runs (tenancy, permission, preconditions, idempotency, rate limit, interceptors, the
 *           unit of work); the app's bindings decide what each step does. A refusal resolves; any other error rejects.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0138 (as amended: the fixed pipeline); ADR 0140.
 */
import type { AnyClass } from "@stackra/container";
import { isRefusal, type Refusal } from "@stackra/errors";

import type { Action, CallInput, OutputOf, Query } from "#core/index";
import { CURRENT_PIPELINE } from "#testing/constants/current-pipeline.constant";
import type { RunOptions } from "#testing/types/run-options.type";
import type { RunResult } from "#testing/types/run-result.type";

/** The events the app published so far, when `@stackra/events/testing` added `app.events`. */
function publishedBy(app: object): readonly object[] {
  return (app as { events?: { published(): readonly object[] } }).events?.published() ?? [];
}

/** A result whose `output` throws the refusal of a refused call (non-enumerable, so printing never throws). */
function resultOf<O>(
  output: O | undefined,
  error: Refusal | undefined,
  events: readonly object[],
): RunResult<O> {
  const result = { ok: error === undefined, error, events: Object.freeze([...events]) };
  Object.defineProperty(result, "output", {
    get(): O {
      if (error !== undefined) throw error;
      return output as O;
    },
  });
  return Object.freeze(result) as unknown as RunResult<O>;
}

/**
 * Runs `type` with `input` as `options.as` through the current testing app's pipeline.
 *
 * @throws Error before any testing app compiled; any non-refusal error the call throws.
 * @example
 * const placed = await run(CreateOrderAction, input, { as: actors.customer(), idempotencyKey: "k1" });
 * expect(placed.output.orderId).toMatch(/^ord_/);
 * expect(await run(CreateOrderAction, input, { as })).toRefuseWith(refusal(OrdersPausedError));
 */
export async function run<C extends AnyClass<Action | Query>>(
  type: C,
  input: CallInput<InstanceType<C>>,
  options: RunOptions,
): Promise<RunResult<OutputOf<InstanceType<C>>>> {
  const current = CURRENT_PIPELINE.value;
  if (current === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before calling run()",
    );
  const { as, ...request } = options;
  const before = publishedBy(current.app).length;
  try {
    const output = await current.pipeline.execute(type, input, { ...request, actor: as });
    return resultOf(output, undefined, publishedBy(current.app).slice(before));
  } catch (error) {
    if (!isRefusal(error)) throw error;
    return resultOf<OutputOf<InstanceType<C>>>(
      undefined,
      error,
      publishedBy(current.app).slice(before),
    );
  }
}
