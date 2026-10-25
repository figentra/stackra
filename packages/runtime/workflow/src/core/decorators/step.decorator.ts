/**
 * Stackra file contract:
 * Purpose: `@Step(options)`, the method decorator that gives a workflow step its options (`after`, `when`,
 *          `heartbeat`, `retry`, `waitFor`, `correlate`, `timeout`). It never makes a method a step: every public async
 *          method is one by its place in the class.
 * Boundary: made with `createDecorator`, so it records its options and nothing else; the engine reads them with
 *           `Step.members(type)` when it first runs the class (ADR 0294 decision 6: decorators record, the kind acts).
 *           On a field, or on a class that is not a workflow, it throws a TypeError at class definition. Generic in the
 *           workflow, for typed callbacks: `@Step<MyWorkflow>({ correlate: (run) => run.input.id })`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 18 and 23: one of the two method decorators, beside `@Transition`);
 *                     ADR 0305; ADR 0005 (legacy decorators).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { Decorator } from "@stackra/container";

import type { StepDecorator } from "#core/types/step-decorator.type";
import type { StepOptions } from "#core/types/step-options.type";

/** The `Step` value: generic in the workflow, and the reader of what it recorded. */
type StepKind = (<W = unknown>(options: StepOptions<W>) => StepDecorator) &
  Pick<Decorator<StepOptions<never>>, "kind" | "target" | "kinds" | "on" | "members">;

/**
 * The step decorator.
 *
 * @example
 * export class RedeemPointsWorkflow extends Workflow<RedeemPointsInput>({ timeout: "20m" }) {
 *   @Step<RedeemPointsWorkflow>({
 *     waitFor: RedemptionConfirmed,
 *     correlate: (run) => ({ memberId: run.results.quote.memberId, reference: run.results.quote.reference }),
 *     timeout: "15m",
 *   })
 *   async confirm(_run: Run<this>, _ctx: StepContext, confirmed: RedemptionConfirmed): Promise<RedemptionConfirmed> {
 *     return confirmed;
 *   }
 * }
 */
export const Step = createDecorator<StepOptions<never>>({
  kind: "step",
  target: DecoratorTarget.Method,
  kinds: ["workflow"],
}) as unknown as StepKind;
