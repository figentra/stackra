/**
 * Stackra file contract:
 * Purpose: `Listener`, the kind base of one reaction to one event, in both forms: `extends Listener` runs after commit
 *          in process, `extends Listener({ queue, retry })` runs on a worker queue. The event it reacts to is the
 *          type of its `handle` parameter, which gen reads and registers with `registerListeners`.
 * Boundary: a binding: its dependencies are its constructor parameters, wired by gen. One listener has one `handle`;
 *           a second reaction is a second listener, so each retries and fails alone. `ListenerBase` is the instance
 *           side (its abstract `handle` must be implemented); it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 16 and 25; amendment item 5); ADR 0305 (rule 2); ADR 0078 (decision 4).
 */
import { createKind } from "@stackra/container";

import type { ListenerClass } from "#core/types/listener-class.type";
import type { ListenerContext } from "#core/types/listener-context.type";
import type { ListenerOptions } from "#core/types/listener-options.type";

/** The instance side every listener shares. */
export abstract class ListenerBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a listener. */
  declare readonly "~kind": "listener";

  /**
   * Reacts to one event. Throwing records a failure for this listener only; the emitter and other listeners never
   * see it.
   *
   * @param event - the event, typed by the subclass; its type is the subscription.
   * @param ctx - the occurrence's metadata and the clock.
   */
  abstract handle(event: never, ctx: ListenerContext): Promise<void>;
}

/** A listener instance. */
export type Listener = ListenerBase;

/** Checks the options of the called form. */
function read(options: ListenerOptions = {}) {
  if (options.queue !== undefined && (typeof options.queue !== "string" || options.queue === ""))
    throw new TypeError(
      `Listener({ queue }) needs a queue name, got ${JSON.stringify(options.queue)}`,
    );
  const attempts = options.retry?.attempts;
  if (attempts !== undefined && (!Number.isInteger(attempts) || attempts < 1))
    throw new RangeError(
      `Listener({ retry: { attempts } }) must be a whole number from 1, got ${attempts}`,
    );
  return { ...options };
}

/**
 * The listener kind base.
 *
 * @example
 * export class EarnOnOrderPaidListener extends Listener({ queue: Queues.Default }) {
 *   constructor(accounts: AccountService) {
 *     super();
 *     this.accounts = accounts;
 *   }
 *
 *   async handle(event: OrderPaid, ctx: ListenerContext): Promise<void> {
 *     await this.accounts.earn(memberId(event.customerId), { reference: event.orderId, at: ctx.now() });
 *   }
 * }
 */
export const Listener = createKind("listener", ListenerBase, read) as ListenerClass &
  ((options: ListenerOptions) => ListenerClass);
