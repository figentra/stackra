/**
 * Stackra file contract:
 * Purpose: `OutcomeDispatcher`, one consumer's routing of outcomes to its own handlers: one handler per registered
 *          outcome kind, called in order with each guarded outcome's parameters and the consumer's context.
 * Boundary: a value built with `OutcomeDispatcher.create`, frozen. A missing or extra handler is the consumer's bug and
 *           throws a `TypeError` at module load, so a registered kind is never left unapplied. It takes a `RuleDecision`,
 *           which only `decide` makes, so every dispatched outcome passed the floor guard. The handlers apply; the
 *           engine never does (ADR 0331 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 9); ADR 0328 (values are built with `create`); config-model section 4.
 */
import type { RuleDecision } from "#core/types/rule-decision.type";
import type { OutcomeHandler } from "#core/types/outcome-handler.type";
import type { Rules } from "#core/values/rules.value";

/**
 * Applies a consumer's outcomes.
 *
 * @example
 * export const RETURNS_OUTCOMES = OutcomeDispatcher.create(RETURNS_RULES, {
 *   refundWindow: (params, order: Order) => order.setRefundDays(params["days"] as number),
 * });
 * await RETURNS_OUTCOMES.dispatch(decision, order);
 */
export class OutcomeDispatcher<C, R> {
  /** The consumer whose kinds it routes. */
  readonly rules: Rules;

  /** One handler per kind key. */
  private readonly handlers: Readonly<Record<string, OutcomeHandler<C, R>>>;

  private constructor(rules: Rules, handlers: Readonly<Record<string, OutcomeHandler<C, R>>>) {
    this.rules = rules;
    this.handlers = handlers;
    Object.freeze(this);
  }

  /**
   * The dispatcher of `rules`' outcome kinds to `handlers`.
   *
   * @throws TypeError when a registered kind has no handler, or a handler names no registered kind.
   */
  static create<C, R>(
    rules: Rules,
    handlers: Readonly<Record<string, OutcomeHandler<C, R>>>,
  ): OutcomeDispatcher<C, R> {
    const kinds = rules.outcomeKinds().map((kind) => kind.key);
    for (const kind of kinds)
      if (typeof handlers[kind] !== "function")
        throw new TypeError(`OutcomeDispatcher.create: ${rules.key} has no handler for ${kind}`);
    for (const key of Object.keys(handlers))
      if (!kinds.includes(key))
        throw new TypeError(
          `OutcomeDispatcher.create: ${rules.key} registers no outcome kind ${key}`,
        );
    return new OutcomeDispatcher(rules, Object.freeze({ ...handlers }));
  }

  /**
   * Applies each outcome of `decision`, one after another, with `context`.
   *
   * @returns what each handler returned, in outcome order; empty for a decision that did not match.
   */
  async dispatch(decision: RuleDecision, context: C): Promise<R[]> {
    const results: R[] = [];
    for (const outcome of decision.outcomes) {
      // reason: `create` proved a handler for every registered kind, and `decide` checked each kind is registered
      const handler = this.handlers[outcome.kind] as OutcomeHandler<C, R>;
      // oxlint-disable-next-line no-await-in-loop -- outcomes apply in order, one after another
      results.push(await handler(outcome.params, context));
    }
    return results;
  }
}
