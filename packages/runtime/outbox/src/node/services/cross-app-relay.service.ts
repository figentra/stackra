/**
 * Stackra file contract:
 * Purpose: `CrossAppRelayService`, the producer's cross-app relay: on every tick one relay of the service, holding its
 *          own lock, takes the due deliveries (fair across subscribers), sends each subscriber's in order as one signed
 *          POST to its inbox, the subscribers side by side, and stops a subscriber at its first failure in the tick so
 *          a slow or failing one never holds another. A 2xx answer deletes the delivery; a network error, a timeout, a
 *          5xx, 408 or 429 retries it after the outbox backoff; any other answer (a permanent refusal) or a last
 *          attempt dead-letters it and logs it. A delivery whose subscriber is no longer configured is dropped and
 *          logged. An operator lists deliveries and replays a dead one.
 * Boundary: a platform service over `DeliveryDriver`, `SubscriberSource`, `EventSigner`, `DeliveryTransport`,
 *           @stackra/locking's `Locks` and the `Clock`; `connect(resolver)` gives it the logger. The requests of a tick
 *           run first; their outcomes are recorded one after another, so the store never sees concurrent statements.
 *           Delivery is at least once: a relay that dies between a 2xx and the delete sends again, and the consumer's
 *           inbox runs the event id once. It never reads an answer's body.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12, 13 and 17, amendment of 2026-11-02); ADR 0078 (decision 4); ADR 0149
 *                     (one runner under a lock); ADR 0148 (backoff).
 */
import type { Resolver } from "@stackra/actions";
import { Service } from "@stackra/container";
import { backoffDelay, Duration, Logger } from "@stackra/contracts";
import type { Clock, PublicId } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { Locks } from "@stackra/locking";
import { JOB_BACKOFF } from "@stackra/queue";

import type {
  Delivery,
  DeliveryDriver,
  DeliveryTransport,
  EventSigner,
  OutboxError,
  SubscriberSource,
} from "#contracts/index";
import { CROSS_APP_DEFAULTS } from "#core/constants/cross-app-defaults.constant";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";

/** What sending one delivery came to. */
type Outcome =
  | { readonly delivery: Delivery; readonly kind: "sent" | "dropped" }
  | {
      readonly delivery: Delivery;
      readonly kind: "failed";
      readonly error: OutboxError;
      readonly permanent: boolean;
    };

/**
 * Sends cross-app deliveries.
 *
 * @example
 * relay.connect(container);
 * await relay.work({ signal });
 */
export class CrossAppRelayService extends Service {
  /** The delivery store. */
  private readonly deliveries: DeliveryDriver;

  /** Where each subscriber's inbox is. */
  private readonly source: SubscriberSource;

  /** Signs each request. */
  private readonly signer: EventSigner;

  /** Sends each request. */
  private readonly transport: DeliveryTransport;

  /** The lock one tick holds. */
  private readonly locks: Locks;

  /** The time source of ticks and retries. */
  private readonly clock: Clock;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param deliveries - the delivery store.
   * @param source - the subscribers and their inboxes.
   * @param signer - the producer's signer.
   * @param transport - the HTTP transport.
   * @param locks - the locks one tick holds.
   * @param clock - the time source of ticks and retries.
   */
  constructor(
    deliveries: DeliveryDriver,
    source: SubscriberSource,
    signer: EventSigner,
    transport: DeliveryTransport,
    locks: Locks,
    clock: Clock,
  ) {
    super();
    this.deliveries = deliveries;
    this.source = source;
    this.signer = signer;
    this.transport = transport;
    this.locks = locks;
    this.clock = clock;
  }

  /** Resolves the logger from `resolver` (a booted container or a testing app). */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /**
   * One tick: when no other relay holds the lock, sends up to a batch of due deliveries and records each outcome.
   *
   * @returns how many deliveries were sent or dropped; `0` when none was due or another relay held the lock.
   */
  async relay(): Promise<number> {
    let done = 0;
    await this.locks.tryWith(CROSS_APP_DEFAULTS.lockKey, CROSS_APP_DEFAULTS.lockTtl, async () => {
      const now = this.clock.now();
      const due = await this.deliveries.due(now, CROSS_APP_DEFAULTS.batchSize);
      const bySubscriber = new Map<string, Delivery[]>();
      for (const delivery of due)
        bySubscriber.set(delivery.subscriber, [
          ...(bySubscriber.get(delivery.subscriber) ?? []),
          delivery,
        ]);
      const outcomes = await Promise.all(
        [...bySubscriber.values()].map((list) => this.sendInOrder(list, now)),
      );
      for (const outcome of outcomes.flat()) {
        await this.record(outcome, now);
        if (outcome.kind !== "failed") done += 1;
      }
    });
    return done;
  }

  /** Ticks until `signal` aborts, pausing after a tick that sent nothing; a failed tick is logged and paused. */
  async work(options: { readonly signal: AbortSignal }): Promise<void> {
    while (!options.signal.aborted) {
      try {
        if ((await this.relay()) === 0) await this.pause(options.signal);
      } catch (error) {
        this.logger()?.error(OUTBOX_LOG_EVENTS.crossAppFailed, { cause: error });
        await this.pause(options.signal);
      }
    }
  }

  /** The deliveries of `subscriber` (all when absent) in `state`, oldest first. */
  list(filter: {
    readonly subscriber?: string;
    readonly state: "pending" | "failing" | "dead";
  }): Promise<readonly Delivery[]> {
    return this.deliveries.list(filter);
  }

  /** Makes the dead delivery `id` due now with no attempts counted; `false` when `id` names no dead delivery. */
  replay(id: PublicId<"dlv">): Promise<boolean> {
    return this.deliveries.replay(id, this.clock.now());
  }

  /** Sends `list` (one subscriber's, oldest first) until the first failure; what each send came to. */
  private async sendInOrder(list: readonly Delivery[], now: Date): Promise<Outcome[]> {
    const outcomes: Outcome[] = [];
    for (const delivery of list) {
      const outcome = await this.send(delivery, now);
      outcomes.push(outcome);
      if (outcome.kind === "failed") break;
    }
    return outcomes;
  }

  /** Signs and posts one delivery. */
  private async send(delivery: Delivery, now: Date): Promise<Outcome> {
    const subscriber = this.source.subscriber(delivery.subscriber);
    if (subscriber === undefined) return { delivery, kind: "dropped" };
    const body = JSON.stringify(delivery.envelope);
    try {
      const headers = await this.signer.sign(delivery.id, now, body);
      const url = new URL(CROSS_APP_DEFAULTS.inboxPath, subscriber.inbox).toString();
      const timeout = Duration.toMilliseconds(CROSS_APP_DEFAULTS.requestTimeout);
      const status = await this.transport.post(url, headers, body, timeout);
      if (status >= 200 && status < 300) return { delivery, kind: "sent" };
      const permanent = status >= 400 && status < 500 && status !== 408 && status !== 429;
      return {
        delivery,
        kind: "failed",
        error: { code: `http_${status}`, message: `the inbox answered ${status}` },
        permanent,
      };
    } catch (error) {
      return {
        delivery,
        kind: "failed",
        error: {
          code: isRefusal(error) ? error.code : "delivery_failed",
          message: error instanceof Error ? error.message : String(error),
        },
        permanent: false,
      };
    }
  }

  /** Records one outcome: deletes a sent or dropped delivery, retries or dead-letters a failed one. */
  private async record(outcome: Outcome, now: Date): Promise<void> {
    const { delivery } = outcome;
    if (outcome.kind !== "failed") {
      await this.deliveries.remove(delivery.id);
      if (outcome.kind === "dropped")
        this.logger()?.warn(OUTBOX_LOG_EVENTS.deliveryDropped, {
          deliveryId: delivery.id,
          subscriber: delivery.subscriber,
          type: delivery.envelope.type,
        });
      return;
    }
    const attempt = delivery.attempts + 1;
    if (!outcome.permanent && attempt < CROSS_APP_DEFAULTS.attempts) {
      const availableAt = new Date(
        now.getTime() +
          backoffDelay({ ...JOB_BACKOFF, backoff: CROSS_APP_DEFAULTS.backoff }, attempt),
      );
      await this.deliveries.retry(delivery.id, availableAt, outcome.error);
      return;
    }
    await this.deliveries.deadLetter(delivery.id, outcome.error, now);
    this.logger()?.error(OUTBOX_LOG_EVENTS.deliveryDead, {
      deliveryId: delivery.id,
      subscriber: delivery.subscriber,
      type: delivery.envelope.type,
      attempts: attempt,
      code: outcome.error.code,
    });
  }

  /** Resolves after the poll interval, or at once when `signal` aborts. */
  private pause(signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", done);
        resolve();
      };
      const timer = setTimeout(done, Duration.toMilliseconds(CROSS_APP_DEFAULTS.pollInterval));
      signal.addEventListener("abort", done, { once: true });
    });
  }

  /** The bound logger, when there is one. */
  private logger(): Logger | undefined {
    const resolver = this.resolver;
    return resolver?.has(Logger) === true ? resolver.get(Logger) : undefined;
  }
}
