/**
 * Stackra file contract:
 * Purpose: `Action({ key, actors, ... })`, the kind base of a state change: one class drives the endpoint, the MCP tool,
 *          the job, the intent and the generated clients. Input and output are the types of its `handle`.
 * Boundary: called only (a key and actors are required, so a bare `extends Action` fails to compile). The options are
 *           checked and recorded in the kind registry with their defaults applied; the module, the locked key, the
 *           permission and the route are derived by gen. A binding: dependencies are constructor parameters. It runs
 *           only through `ActionPipeline`, never by calling `handle` from another class.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20, 21 and 25); ADR 0305 (rules 2, 28 and 30); ADR 0098 (actions are the
 *                     unit); ADR 0136; ADR 0138 (as amended); ADR 0338 (decision 5: `offline.cap`); ADR 0337
 *                     (decisions 4 and 5: `accepts`).
 */
import { createKind } from "@stackra/container";
import { ActorKind, Enum } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import { Precondition } from "#core/bases/precondition.base";
import { RULE_VERSION_PATTERN } from "#core/constants/rule-version-pattern.constant";
import { ConflictResolution } from "#core/enums/conflict-resolution.enum";
import { Idempotency } from "#core/enums/idempotency.enum";
import { IdMinting } from "#core/enums/id-minting.enum";
import { MeterKind } from "#core/enums/meter-kind.enum";
import { OfflineMode } from "#core/enums/offline-mode.enum";
import { OfflinePrecondition } from "#core/enums/offline-precondition.enum";
import { readCallOptions } from "#core/functions/read-call-options.function";
import type { ActionClass } from "#core/types/action-class.type";
import type { ActionContext } from "#core/types/action-context.type";
import type { ActionOptions } from "#core/types/action-options.type";

/** A five-field cron expression: minute, hour, day of month, month, day of week. */
const CRON = /^\S+(?:\s+\S+){4}$/;

/** A meter name: dotted snake_case (`messages.sent`). */
const METER_NAME = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

/** The instance side every action shares. */
export abstract class ActionBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for an action. */
  declare readonly "~kind": "action";

  /**
   * Does the work of one call. The subclass types `input` (the input schema) and the resolved output (the output
   * schema); a Refusal it throws is the call's refusal, anything else is a bug.
   */
  abstract handle(input: never, ctx: ActionContext): Promise<unknown>;
}

/** An action instance. */
export type Action = ActionBase;

/** Throws a `RangeError` when `text` is not a duration (`"72h"`, `"2m"`). */
function checkDuration(option: string, text: unknown): void {
  try {
    duration(String(text));
  } catch {
    throw new RangeError(
      `Action({ ${option} }) must be a duration such as "2m", got ${JSON.stringify(text)}`,
    );
  }
}

/** Checks the options of an action and applies their defaults. */
function read(options: ActionOptions) {
  const shared = readCallOptions("Action", options);
  for (const type of options.preconditions ?? [])
    if (typeof type !== "function" || !(type.prototype instanceof Precondition))
      throw new TypeError(
        `Action({ preconditions }) lists classes that extend Precondition (${options.key})`,
      );
  const idempotency = options.idempotency ?? Idempotency.Optional;
  if (!Enum.values(Idempotency).includes(idempotency))
    throw new RangeError(
      `Action({ idempotency }) takes an Idempotency, got ${JSON.stringify(idempotency)}`,
    );
  const { rateLimit, job, offline, accepts } = options;
  if (rateLimit !== undefined) {
    if (!Number.isInteger(rateLimit.perMinute) || rateLimit.perMinute < 1)
      throw new RangeError(
        `Action({ rateLimit: { perMinute } }) must be a whole number from 1, got ${rateLimit.perMinute}`,
      );
    if (rateLimit.by !== undefined && rateLimit.by !== "principal" && rateLimit.by !== "tenant")
      throw new RangeError(
        `Action({ rateLimit: { by } }) is "principal" or "tenant", got ${JSON.stringify(rateLimit.by)}`,
      );
  }
  if (job !== undefined) {
    if (!options.actors.some((actor) => actor === ActorKind.System || actor === ActorKind.Job))
      throw new TypeError(
        `Action({ job }) needs the system or job actor (${options.key}): job_without_system_actor`,
      );
    if (job.queue !== undefined && (typeof job.queue !== "string" || job.queue === ""))
      throw new TypeError(
        `Action({ job: { queue } }) needs a queue code, got ${JSON.stringify(job.queue)}`,
      );
    if (job.timeout !== undefined) checkDuration("job: { timeout }", job.timeout);
    if (job.retries !== undefined && (!Number.isInteger(job.retries) || job.retries < 0))
      throw new RangeError(
        `Action({ job: { retries } }) must be a whole number from 0, got ${job.retries}`,
      );
    if (
      job.cron !== undefined &&
      (typeof job.cron.schedule !== "string" || !CRON.test(job.cron.schedule.trim()))
    )
      throw new TypeError(
        `Action({ job: { cron: { schedule } } }) needs a five-field cron expression, got ${JSON.stringify(job.cron.schedule)}`,
      );
  }
  if (offline !== undefined) {
    if (!Enum.values(OfflineMode).includes(offline.mode))
      throw new RangeError(
        `Action({ offline: { mode } }) takes an OfflineMode, got ${JSON.stringify(offline.mode)}`,
      );
    if (!Enum.values(IdMinting).includes(offline.idMinting))
      throw new RangeError(
        `Action({ offline: { idMinting } }) takes an IdMinting, got ${JSON.stringify(offline.idMinting)}`,
      );
    if (!Enum.values(OfflinePrecondition).includes(offline.precondition))
      throw new RangeError(
        `Action({ offline: { precondition } }) takes an OfflinePrecondition, got ${JSON.stringify(offline.precondition)}`,
      );
    checkDuration("offline: { retention }", offline.retention);
    if (
      !Array.isArray(offline.onConflict) ||
      offline.onConflict.length === 0 ||
      !offline.onConflict.every((resolution) =>
        Enum.values(ConflictResolution).includes(resolution),
      )
    )
      throw new RangeError(
        `Action({ offline: { onConflict } }) lists at least one ConflictResolution (${options.key})`,
      );
    const { cap } = offline;
    if (cap !== undefined) {
      if (cap.count === undefined && cap.amount === undefined)
        throw new RangeError(
          `Action({ offline: { cap } }) needs a count, an amount or both (${options.key})`,
        );
      for (const [name, value] of [
        ["count", cap.count],
        ["amount", cap.amount],
      ] as const)
        if (value !== undefined && (!Number.isSafeInteger(value) || value < 1))
          throw new RangeError(
            `Action({ offline: { cap: { ${name} } } }) must be a whole number from 1, got ${value}`,
          );
      checkDuration("offline: { cap: { window } }", cap.window);
      if (
        cap.amountField !== undefined &&
        (typeof cap.amountField !== "string" || cap.amountField === "")
      )
        throw new TypeError(
          `Action({ offline: { cap: { amountField } } }) names an input field, got ${JSON.stringify(cap.amountField)}`,
        );
    }
  }
  if (accepts !== undefined) {
    if (typeof accepts.ruleVersion !== "string" || !RULE_VERSION_PATTERN.test(accepts.ruleVersion))
      throw new RangeError(
        `Action({ accepts: { ruleVersion } }) is dotted whole numbers such as "2.4.0", got ${JSON.stringify(accepts.ruleVersion)}`,
      );
    if (
      typeof accepts.evaluator !== "function" ||
      typeof (accepts.evaluator.prototype as { evaluate?: unknown } | undefined)?.evaluate !==
        "function"
    )
      throw new TypeError(
        `Action({ accepts: { evaluator } }) names a class with an evaluate(input, ctx) method (${options.key})`,
      );
  }
  if (options.structural !== undefined && typeof options.structural !== "boolean")
    throw new TypeError(
      `Action({ structural }) is true or false, got ${JSON.stringify(options.structural)}`,
    );
  const { meter } = options;
  if (meter !== undefined) {
    if (typeof meter.name !== "string" || !METER_NAME.test(meter.name))
      throw new RangeError(
        `Action({ meter: { name } }) is dotted snake_case such as "messages.sent", got ${JSON.stringify(meter.name)}`,
      );
    if (!Enum.values(MeterKind).includes(meter.kind))
      throw new RangeError(
        `Action({ meter: { kind } }) takes a MeterKind, got ${JSON.stringify(meter.kind)}`,
      );
    if (meter.kind !== MeterKind.Count && (typeof meter.field !== "string" || meter.field === ""))
      throw new TypeError(
        `Action({ meter: { field } }) names the input field a ${meter.kind} meter reads (${options.key})`,
      );
  }
  return {
    ...options,
    ...shared,
    preconditions: Object.freeze([...(options.preconditions ?? [])]),
    idempotency,
    tool: options.tool ?? false,
    intent: options.intent ?? false,
    structural: options.structural ?? false,
  };
}

/**
 * The action kind base.
 *
 * @example
 * export class CancelOrderAction extends Action({
 *   key: "order.cancel",
 *   actors: [ActorKind.User, ActorKind.Agent],
 *   tool: true,
 * }) {
 *   constructor(orders: OrderService) {
 *     super();
 *     this.orders = orders;
 *   }
 *
 *   async handle(input: CancelOrderInput, ctx: ActionContext): Promise<CancelOrderOutput> {
 *     const order = await this.orders.findOneOrFail({ id: input.orderId });
 *     await ctx.authorize(order);
 *     return CancelOrderOutput.create({ orderId: order.id, status: order.status });
 *   }
 * }
 */
export const Action = createKind("action", ActionBase, read) as (
  options: ActionOptions,
) => ActionClass;
