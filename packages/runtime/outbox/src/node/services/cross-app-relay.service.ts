/**
 * Stackra file contract:
 * Purpose: `CrossAppRelayService`, the producer's cross-app relay: on every tick one relay of the service, holding its
 *          own lock only for that step, leases the due deliveries (a batch per subscriber), then sends the subscribers
 *          in parallel and each subscriber's deliveries in order, with no transaction open, each as one signed `POST <inbox origin>/events/inbox` of the envelope. A
 *          2xx answer deletes the delivery; a network error, a timeout, a redirect, a 5xx, 408 or 429 retries it after
 *          the outbox's backoff and dead-letters it after the outbox's attempts; any other 4xx (a permanent refusal,
 *          401 and 422 among them) dead-letters it at once. A subscriber stops at its first failure in a tick, so a
 *          failing consumer never holds back a healthy one. Every dead letter is logged with subscriber, type and code.
 * Boundary: a platform service over the `DeliveryDriver`, `SubscriberSource` and `EventSigner` ports, @stackra/locking's
 *           `Locks`, the `Clock` and the global `fetch` (a test stubs it). The body is the stored envelope with
 *           `envelopeVersion` and without `producer` (the consumer sets it). Requests go only to a configured inbox
 *           origin, follow no redirect and wait ten seconds at most; the lease outlasts a subscriber's batch, so a crash
 *           mid-send only delays its rows (delivery is at least once; the inbox deduplicates). Nothing of a body is
 *           kept or logged. A delivery
 *           whose subscriber the source no longer lists is dead-lettered (`unsubscribed`). A signing failure fails the
 *           tick (logged by `work`), spending no attempt. `connect` is optional: it gives the logger.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12, 13 and 16, amendment of 2026-11-02); ADR 0078 (decision 4); ADR 0149
 *                     (one runner under a lock); ADR 0148 (backoff).
 */
import type { Resolver } from "@stackra/actions";
import { Service } from "@stackra/container";
import { backoffDelay, Duration, Logger } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import type { Locks } from "@stackra/locking";
import { JOB_BACKOFF } from "@stackra/queue";

import type {
  Delivery,
  DeliveryDriver,
  DeliveryError,
  EventSigner,
  SubscriberSource,
} from "#contracts/index";
import { CROSS_APP_DEFAULTS } from "#core/constants/cross-app-defaults.constant";
import { OUTBOX_DEFAULTS } from "#core/constants/outbox-defaults.constant";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";
import { pauseFor } from "#core/functions/pause-for.function";

/** Whether an answered status is worth another attempt: a 4xx other than 408 and 429 is a permanent refusal. */
function retryable(status: number): boolean {
  return status < 400 || status >= 500 || status === 408 || status === 429;
}

/**
 * Relays cross-app deliveries.
 *
 * @example
 * relay.connect(container);
 * await relay.work({ signal: shutdown.signal });
 */
export class CrossAppRelayService extends Service {
  /** Where deliveries are stored. */
  private readonly driver: DeliveryDriver;

  /** Each subscriber's inbox origin. */
  private readonly source: SubscriberSource;

  /** Signs each request as the producer. */
  private readonly signer: EventSigner;

  /** Keeps one cross-app relay per service running a tick. */
  private readonly locks: Locks;

  /** Reads "now" for a tick, a signature and a retry. */
  private readonly clock: Clock;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param driver - the delivery store.
   * @param source - the subscribers and their inbox origins.
   * @param signer - the producer's request signer.
   * @param locks - the locks one tick holds.
   * @param clock - the time source of ticks, signatures and retries.
   */
  constructor(
    driver: DeliveryDriver,
    source: SubscriberSource,
    signer: EventSigner,
    locks: Locks,
    clock: Clock,
  ) {
    super();
    this.driver = driver;
    this.source = source;
    this.signer = signer;
    this.locks = locks;
    this.clock = clock;
  }

  /** Resolves the logger from `resolver` (a booted container or a testing app). */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /**
   * One tick: when no other cross-app relay holds the lock, leases the due deliveries in one short step and releases
   * the lock; then, with no transaction open, sends them, subscribers in parallel and each subscriber's in order up to
   * its first failure, recording each outcome on its own. A row left unsent (a failure before it, a crash) is due
   * again when its lease ends.
   *
   * @returns how many deliveries the tick tried; `0` when none was due or another relay held the lock.
   * @throws Error a store's, the signer's or the lock's error.
   */
  async relay(): Promise<number> {
    const now = this.clock.now();
    const until = new Date(now.getTime() + Duration.toMilliseconds(CROSS_APP_DEFAULTS.lease));
    let leased: readonly Delivery[] = [];
    await this.locks.tryWith(CROSS_APP_DEFAULTS.lockKey, OUTBOX_DEFAULTS.lockTtl, async () => {
      leased = await this.driver.lease(now, CROSS_APP_DEFAULTS.batchSize, until);
    });
    const bySubscriber = new Map<string, Delivery[]>();
    for (const delivery of leased)
      bySubscriber.set(delivery.subscriber, [
        ...(bySubscriber.get(delivery.subscriber) ?? []),
        delivery,
      ]);
    const counts = await Promise.all(
      [...bySubscriber.values()].map((deliveries) => this.deliverInOrder(deliveries, now)),
    );
    return counts.reduce((sum, count) => sum + count, 0);
  }

  /**
   * Ticks until `signal` aborts, pausing the poll interval after a tick that tried nothing; a tick that fails is logged
   * and paused after the same way.
   */
  async work(options: { readonly signal: AbortSignal }): Promise<void> {
    while (!options.signal.aborted) {
      try {
        if ((await this.relay()) === 0)
          await pauseFor(options.signal, OUTBOX_DEFAULTS.pollInterval);
      } catch (error) {
        this.logger()?.error(OUTBOX_LOG_EVENTS.crossAppRelayFailed, { cause: error });
        await pauseFor(options.signal, OUTBOX_DEFAULTS.pollInterval);
      }
    }
  }

  /** Sends one subscriber's `deliveries` in order, stopping at the first that fails; how many it tried. */
  private async deliverInOrder(deliveries: readonly Delivery[], now: Date): Promise<number> {
    let tried = 0;
    for (const delivery of deliveries) {
      tried += 1;
      if (!(await this.deliver(delivery, now))) break;
    }
    return tried;
  }

  /** Sends one delivery and records how it went; whether the consumer took it. */
  private async deliver(delivery: Delivery, now: Date): Promise<boolean> {
    const subscriber = (await this.source.subscribersOf(delivery.type)).find(
      (each) => each.member === delivery.subscriber,
    );
    if (subscriber === undefined) {
      await this.dead(delivery, { code: "unsubscribed" }, now);
      return false;
    }
    const body = JSON.stringify(delivery.envelope);
    const headers = await this.signer.sign(delivery.id, now, body);
    let failure: DeliveryError;
    try {
      const response = await fetch(new URL(CROSS_APP_DEFAULTS.inboxPath, subscriber.inbox), {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(Duration.toMilliseconds(CROSS_APP_DEFAULTS.timeout)),
      });
      await response.body?.cancel();
      if (response.status >= 200 && response.status < 300) {
        await this.driver.remove(delivery.id);
        return true;
      }
      failure = { code: "http_status", status: response.status };
      if (!retryable(response.status)) {
        await this.dead(delivery, failure, now);
        return false;
      }
    } catch (error) {
      failure = {
        code: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network",
      };
    }
    const attempt = delivery.attempts + 1;
    if (attempt >= OUTBOX_DEFAULTS.attempts) {
      await this.dead(delivery, failure, now);
      return false;
    }
    const availableAt = new Date(
      now.getTime() + backoffDelay({ ...JOB_BACKOFF, backoff: OUTBOX_DEFAULTS.backoff }, attempt),
    );
    await this.driver.retry(delivery.id, availableAt, failure);
    return false;
  }

  /** Dead-letters `delivery` with `failure` and logs it by subscriber, type and code. */
  private async dead(delivery: Delivery, failure: DeliveryError, now: Date): Promise<void> {
    await this.driver.deadLetter(delivery.id, failure, now);
    this.logger()?.error(OUTBOX_LOG_EVENTS.deliveryDead, {
      deliveryId: delivery.id,
      subscriber: delivery.subscriber,
      type: delivery.type,
      attempts: delivery.attempts + 1,
      code: failure.code,
      ...(failure.status === undefined ? {} : { status: failure.status }),
    });
  }

  /** The bound logger, when there is one. */
  private logger(): Logger | undefined {
    const resolver = this.resolver;
    return resolver?.has(Logger) === true ? resolver.get(Logger) : undefined;
  }
}
