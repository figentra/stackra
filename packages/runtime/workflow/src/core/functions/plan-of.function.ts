/**
 * Stackra file contract:
 * Purpose: `planOf`, how the engine reads a workflow class once: its steps (every method other than `output` and the
 *          `undo<Step>` compensations, ancestors' first, in declaration order, moved only by `after`), each step's
 *          checked `@Step` options, each undo's step, the run timeout, the pinned version and the `startOn` options.
 * Boundary: internal; cached per class. Everything it refuses fails when the class is first run, or at boot through
 *           the explorer: an undo naming no step, an `after` naming no other step or forming a cycle, a bad duration,
 *           a retry budget below one, a `waitFor` that is neither a signal nor an event. It cannot see `private`, so a private helper
 *           method counts as a step (the purity lint keeps helpers out of a workflow, ADR 0151).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 18); ADR 0151 (0294 note: the class is the graph); ADR 0152 (0294 note: gen
 *                     refuses an undo naming no step; decision 1: a step waits for an event or a signal; decision 2:
 *                     the version pin).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Backoff, Duration, Enum } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import { WorkflowBase } from "#core/bases/workflow-base.base";
import { Step } from "#core/decorators/step.decorator";
import { workflowKey } from "#core/functions/workflow-key.function";
import type { StepOptions } from "#core/types/step-options.type";
import type { StepPlan } from "#core/types/step-plan.type";
import type { WorkflowOptions } from "#core/types/workflow-options.type";
import type { WorkflowPlan } from "#core/types/workflow-plan.type";

/** The plans built so far. */
const PLANS = new WeakMap<AnyClass, WorkflowPlan>();

/** An undo's method name: `undo` and a capital. */
const UNDO = /^undo[A-Z]/;

/** The kinds a step may wait for: a signal, or an event a building block correlates. */
const WAITABLE: ReadonlySet<string> = new Set(["signal", "domain_event", "integration_event"]);

/**
 * The milliseconds of `text`, or `undefined` without one.
 *
 * @throws RangeError when `text` is not a duration.
 */
function millisecondsOf(
  where: string,
  option: string,
  text: string | undefined,
): number | undefined {
  if (text === undefined) return undefined;
  try {
    return Duration.toMilliseconds(duration(text));
  } catch {
    throw new RangeError(
      `${where}: ${option} must be a duration such as "15m", got ${JSON.stringify(text)}`,
    );
  }
}

/** The method names of `type` and its ancestors below the kind base, ancestors' first, each once. */
function methodsOf(type: AnyClass): string[] {
  const chain: object[] = [];
  for (
    let prototype = type.prototype as object | null;
    prototype !== null && prototype !== WorkflowBase.prototype && prototype !== Object.prototype;
    prototype = Object.getPrototypeOf(prototype) as object | null
  )
    chain.unshift(prototype);
  const names: string[] = [];
  for (const prototype of chain)
    for (const name of Object.getOwnPropertyNames(prototype))
      if (
        name !== "constructor" &&
        !names.includes(name) &&
        typeof Object.getOwnPropertyDescriptor(prototype, name)?.value === "function"
      )
        names.push(name);
  return names;
}

/**
 * The plan of step `name`.
 *
 * @throws RangeError for a bad duration, retry budget or backoff; TypeError for a `waitFor` that is neither a signal
 *         nor an event.
 */
function stepOf(
  owner: string,
  name: string,
  options: StepOptions<never>,
  undo: string | undefined,
): StepPlan {
  const where = `${owner}.${name}`;
  const attempts = options.retry?.attempts ?? 1;
  if (!Number.isInteger(attempts) || attempts < 1)
    throw new RangeError(`${where}: retry.attempts must be a whole number from 1, got ${attempts}`);
  const backoff = options.retry?.backoff ?? Backoff.Exponential;
  if (!Enum.values(Backoff).includes(backoff))
    throw new RangeError(
      `${where}: retry.backoff takes a Backoff code, got ${JSON.stringify(backoff)}`,
    );
  const { waitFor, when, correlate } = options;
  if (waitFor !== undefined && !WAITABLE.has(kindOf(waitFor)?.kind ?? ""))
    throw new TypeError(`${where}: waitFor takes a class that extends Signal, or an event`);
  const timeout = millisecondsOf(where, "timeout", options.timeout);
  const heartbeat = millisecondsOf(where, "heartbeat", options.heartbeat);
  return Object.freeze({
    name,
    after: Object.freeze([...(options.after ?? [])]),
    attempts,
    backoff,
    ...(when === undefined ? {} : { when }),
    ...(heartbeat === undefined ? {} : { heartbeat }),
    ...(waitFor === undefined ? {} : { waitFor, signal: workflowKey(waitFor) }),
    ...(correlate === undefined ? {} : { correlate }),
    ...(timeout === undefined ? {} : { timeout }),
    ...(undo === undefined ? {} : { undo }),
  });
}

/**
 * `steps` in run order: declaration order, except that a step waits for every step its `after` names.
 *
 * @throws TypeError when an `after` names no other step, or the `after` options form a cycle.
 */
function ordered(owner: string, steps: readonly StepPlan[]): readonly StepPlan[] {
  const names = new Set(steps.map((step) => step.name));
  for (const step of steps)
    for (const name of step.after)
      if (!names.has(name) || name === step.name)
        throw new TypeError(
          `${owner}.${step.name}: after names ${name}, which is not another step`,
        );
  const done = new Set<string>();
  const order: StepPlan[] = [];
  while (order.length < steps.length) {
    const next = steps.find(
      (step) => !done.has(step.name) && step.after.every((name) => done.has(name)),
    );
    if (next === undefined)
      throw new TypeError(`${owner}: the after options of its steps form a cycle`);
    done.add(next.name);
    order.push(next);
  }
  return Object.freeze(order);
}

/**
 * The plan of workflow class `type`.
 *
 * @throws TypeError when `type` is not a workflow, or its steps or undos do not fit together; RangeError for a bad
 *         option value.
 * @example
 * planOf(CreateOrderWorkflow).steps.map((step) => step.name); // ["price", "reserveStock", "createOrder", "authorizePayment"]
 */
export function planOf(type: AnyClass): WorkflowPlan {
  const known = PLANS.get(type);
  if (known !== undefined) return known;
  const record = kindOf(type);
  if (record?.kind !== "workflow")
    throw new TypeError(`${type.name} is not a workflow: extend Workflow({ ... })`);
  const { startOn, correlate, timeout, version } =
    record.options as unknown as WorkflowOptions<never>;
  const methods = methodsOf(type);
  const names = methods.filter((name) => name !== "output" && !UNDO.test(name));
  const undos = new Map<string, string>();
  for (const method of methods.filter((name) => UNDO.test(name))) {
    const step = method.charAt(4).toLowerCase() + method.slice(5);
    if (!names.includes(step))
      throw new TypeError(`${type.name}.${method} undoes no step: ${type.name} has no ${step}`);
    undos.set(step, method);
  }
  const decorated = Step.members(type);
  const steps = names.map((name) =>
    stepOf(type.name, name, decorated.get(name) ?? {}, undos.get(name)),
  );
  const limit = millisecondsOf(type.name, "timeout", timeout);
  const plan: WorkflowPlan = Object.freeze({
    key: workflowKey(type),
    version: version ?? 1,
    steps: ordered(type.name, steps),
    ...(limit === undefined ? {} : { timeout: limit }),
    ...(startOn === undefined ? {} : { startOn }),
    ...(correlate === undefined ? {} : { correlate }),
  });
  PLANS.set(type, plan);
  return plan;
}
