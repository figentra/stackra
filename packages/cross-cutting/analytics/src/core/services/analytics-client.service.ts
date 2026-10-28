/**
 * Stackra file contract:
 * Purpose: `AnalyticsClient`, the one way an analytics event leaves the device: `track(LeadSubmitted.create({ plan }))`
 *          sends it through the selected `AnalyticsDriver` when the consent category is granted, keeps it in a bounded
 *          ordered queue while the visitor has not decided, and drops it on refusal; the queue is sent in order on
 *          acceptance and discarded unsent on refusal. Identity stitching: `identify(userId)` links the anonymous
 *          visitor to the signed-in user, `group(type, id)` puts the visitor in a group, and `reset()` (sign-out)
 *          starts a new anonymous visitor; the identity is kept through the `AnalyticsIdentity` port after consent.
 * Boundary: a singleton service over `AnalyticsConfig`, the driver, the `ConsentLedger`, which alone decides (Global
 *           Privacy Control reads as a refusal there), and the identity store. Only the fields the event's schema
 *           declares leave, minus `denyProperties`, with the envelope v2 ids and context: the event id, context, user
 *           id and groups are taken at `track`; the anonymous visitor and session ids are made (or the anonymous id
 *           restored from the identity store) only once consent allows a send; the user id and groups are not
 *           restored, the host calls `identify` and `group` again after sign-in. The identity is written only while the
 *           category is granted and cleared as soon as it is refused or on `reset`; the session id is never stored.
 *           `identify` and `group` are deliveries of their own kind, gated and queued like events. `userId` is the
 *           person's public id, never a contact field; a destination that needs it hashed hashes it. A full queue drops
 *           the newest event, so the first view and the events before the answer survive. A driver's failure never
 *           reaches the caller. The delivery engine (stackra-406) sits after consent: sampled-in deliveries wait in a
 *           buffer (at most `bufferLimit`) that is sent at `flushAt` deliveries or after `flushIntervalMs`; a failed
 *           batch goes back to the front and is retried `retryAttempts` times with backoff (`backoffDelay`, equal
 *           jitter, `retryBaseMs` to `retryMaxMs`), then kept in the `AnalyticsOfflineQueue` (the `none` default
 *           drops it); when the page hides, the buffer leaves through the driver's `beacon`, or `send` when it has
 *           none. Sampling is per visitor: `sampleRate`, or the event's own `sampleRates` entry; `identify` and `group`
 *           are never sampled. A refusal drops the buffer and the offline queue. Destinations (stackra-407): each
 *           entry of `destinations` (or, when empty, the `driver` gated by `consentCategory`) is its own lane with its
 *           own category, include and exclude lists, pre-consent queue, buffer and retries, so one destination's
 *           consent or outage never holds another; every lane shares the event id (destinations dedup on it) and the
 *           visitor ids. The identity is kept only while `consentCategory` is granted; the in-memory ids go once no
 *           destination is granted. Only the `default` destination uses the offline queue.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 2 and 5); ADR 0071 (no identifier before consent); ADR 0305 (rule 20);
 *                     ADR 0294 (decisions 16, 17 and 26); analytics gaps 5 and 6 (identity stitching, stackra-405; the
 *                     delivery engine, stackra-406); analytics gap 7 (destinations, stackra-407);
 *                     owner D10 2026-10-28 (one backoff formula).
 */
import type { ConsentCategory, ConsentLedger } from "@stackra/consent";
import { ConsentStatus } from "@stackra/consent";
import { type AnyClass, kindOf, Service } from "@stackra/container";
import { backoffDelay, Duration, Jitter } from "@stackra/contracts";
import type { Event } from "@stackra/events";
import { schemaOf } from "@stackra/validation";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDriverLookup } from "#contracts/ports/analytics-driver-lookup.port";
import type { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import type { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import type { AnalyticsContext } from "#contracts/types/analytics-context.type";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { ANALYTICS_DEFAULT_DESTINATION } from "#core/constants/analytics-default-destination.constant";
import { AnalyticsState } from "#core/enums/analytics-state.enum";
import { MemoryAnalyticsIdentityDriver } from "#core/drivers/memory-analytics-identity.driver";
import { NoneAnalyticsDriverLookupDriver } from "#core/drivers/none-analytics-driver-lookup.driver";
import { NoneAnalyticsOfflineQueueDriver } from "#core/drivers/none-analytics-offline-queue.driver";
import { analyticsId } from "#core/functions/analytics-id.function";
import { sampleScore } from "#core/functions/sample-score.function";
import type { AnalyticsDestination } from "#core/types/analytics-destination.type";
import type { AnalyticsLane } from "#core/types/analytics-lane.type";

/** The library name every delivery's context carries. */
const LIBRARY = "@stackra/analytics";

/** A delivery before consent allows a send: no visitor or session id yet. */
type Captured = Omit<AnalyticsDelivery, "anonymousId" | "sessionId">;

/**
 * Delivers analytics events behind consent.
 *
 * @example
 * const analytics = useAnalytics();
 * analytics.track(LeadSubmitted.create({ plan })); // waits in the queue until the visitor decides
 */
export class AnalyticsClient extends Service {
  private readonly config: AnalyticsConfig;

  private readonly ledger: ConsentLedger;

  private readonly identity: AnalyticsIdentity;

  private readonly offline: AnalyticsOfflineQueue;

  private readonly lanes: readonly AnalyticsLane[];

  private anonymousId: string | null = null;

  private sessionId: string | null = null;

  private userId: string | null = null;

  private groups: Readonly<Record<string, string>> = {};

  private stopGuarding: (() => void) | null = null;

  private kept: string | null = null;

  private restored = false;

  private hooked = false;

  /**
   * @param config - the destinations, the gating categories, the queue bound and the deny list.
   * @param driver - the selected driver that sends: the `default` destination.
   * @param ledger - the consent ledger that decides.
   * @param identity - where the visitor's identity is kept after consent; in memory for this launch when absent.
   * @param offline - where the `default` destination's undelivered batches wait for the next launch; nothing is kept
   *                  when absent.
   * @param lookup - finds the named driver instances other destinations send to; none when absent.
   * @throws RangeError when a destination names a driver instance `lookup` does not know.
   */
  constructor(
    config: AnalyticsConfig,
    driver: AnalyticsDriver,
    ledger: ConsentLedger,
    identity: AnalyticsIdentity = new MemoryAnalyticsIdentityDriver(),
    offline: AnalyticsOfflineQueue = new NoneAnalyticsOfflineQueueDriver(),
    lookup: AnalyticsDriverLookup = new NoneAnalyticsDriverLookupDriver(),
  ) {
    super();
    this.config = config;
    this.ledger = ledger;
    this.identity = identity;
    this.offline = offline;
    const destinations: readonly AnalyticsDestination[] =
      config.destinations.length > 0
        ? config.destinations
        : [{ driver: ANALYTICS_DEFAULT_DESTINATION, category: config.consentCategory }];
    this.lanes = destinations.map((destination) => {
      const primary = destination.driver === ANALYTICS_DEFAULT_DESTINATION;
      const sender = primary ? driver : lookup.driver(destination.driver);
      if (sender === undefined)
        throw new RangeError(
          `analytics.destinations names the driver instance "${destination.driver}", which analytics.drivers does not provide`,
        );
      return {
        driver: sender,
        category: destination.category,
        include: new Set(destination.include ?? []),
        exclude: new Set(destination.exclude ?? []),
        primary,
        queue: [],
        buffer: [],
        stopWatching: null,
        timer: null,
        failures: 0,
      };
    });
  }

  /** Where delivery stands: the consent status of `AnalyticsConfig.consentCategory`, read now. */
  get state(): AnalyticsState {
    return this.stateOf(this.config.consentCategory);
  }

  /**
   * Sends `event` to each destination that takes its name, once that destination's consent category allows: at once
   * when granted, after the visitor accepts when undecided (if the queue has room), never when refused.
   *
   * @param event - an instance of an `AnalyticsEvent({ name })` class, built with its `create`.
   * @throws TypeError when `event` is not an analytics event, or its class has no registered schema.
   * @throws ZodError when its fields break the class's schema.
   */
  track(event: Event): void {
    this.enqueue(this.deliveryOf(event));
  }

  /**
   * Links this visitor to the signed-in user `userId` (the person's public id, never an email or a phone): every
   * later event carries it, and an `identify` delivery tells the destinations the anonymous id and the user are one
   * person. Calling it again with the same id does nothing; another id is a new link.
   *
   * @throws RangeError when `userId` is empty.
   */
  identify(userId: string): void {
    if (userId === "") throw new RangeError("identify() needs the user's public id");
    if (userId === this.userId) return;
    this.userId = userId;
    this.enqueue(this.linkOf(AnalyticsDeliveryKind.Identify, "identify", {}));
  }

  /**
   * Puts the visitor in group `id` of `type` (for example `group("scope", scope.id)`): every later event carries the
   * group, and a `group` delivery tells the destinations. One group per type; a new id replaces the old one.
   *
   * @throws RangeError when `type` or `id` is empty.
   */
  group(type: string, id: string): void {
    if (type === "" || id === "") throw new RangeError("group() needs a group type and id");
    if (this.groups[type] === id) return;
    this.groups = Object.freeze({ ...this.groups, [type]: id });
    this.enqueue(this.linkOf(AnalyticsDeliveryKind.Group, "group", { type, id }));
  }

  /**
   * Forgets the visitor (sign-out): no user, no groups, and a new anonymous visitor and session on the next send; the
   * kept identity is removed. Events already queued keep the identity they were captured with.
   */
  reset(): void {
    this.userId = null;
    this.groups = Object.freeze({});
    this.anonymousId = null;
    this.sessionId = null;
    this.kept = null;
    this.identity.clear();
  }

  /**
   * Sends everything buffered now, one batch per destination (a host calls it before a known exit; the engine calls
   * it at `flushAt` or after `flushIntervalMs`). A failure puts that destination's batch back for a retry and never
   * rejects.
   */
  async flush(): Promise<void> {
    await Promise.all(this.lanes.map((lane) => this.flushLane(lane)));
  }

  /** The consent state of `category`, read now. */
  private stateOf(category: ConsentCategory): AnalyticsState {
    const status = this.ledger.status(category);
    if (status === ConsentStatus.Granted) return AnalyticsState.OptedIn;
    return status === ConsentStatus.Denied ? AnalyticsState.OptedOut : AnalyticsState.Pending;
  }

  /** Whether `lane` takes `delivery`: `identify` and `group` always, an event by the include and exclude lists. */
  private routes(lane: AnalyticsLane, delivery: Captured): boolean {
    if ((delivery.kind ?? AnalyticsDeliveryKind.Track) !== AnalyticsDeliveryKind.Track) return true;
    if (lane.exclude.has(delivery.name)) return false;
    return lane.include.size === 0 || lane.include.has(delivery.name);
  }

  /** Per destination that takes it: sends `delivery` now, queues it while undecided, or drops it on refusal. */
  private enqueue(delivery: Captured): void {
    for (const lane of this.lanes) {
      if (!this.routes(lane, delivery)) continue;
      if (this.stateOf(lane.category) !== AnalyticsState.Pending) {
        this.settle(lane, [delivery]);
        continue;
      }
      if (lane.queue.length < this.config.queueLimit) lane.queue.push(delivery);
      lane.stopWatching ??= this.ledger.subscribe(() => this.settle(lane, []));
    }
  }

  /**
   * Once `lane`'s category is decided: sends what waited, then `latest`, on acceptance; drops both on refusal.
   * Undecided keeps waiting.
   */
  private settle(lane: AnalyticsLane, latest: readonly Captured[]): void {
    const state = this.stateOf(lane.category);
    if (state === AnalyticsState.Pending) return;
    const waited = lane.queue.splice(0);
    lane.stopWatching?.();
    lane.stopWatching = null;
    if (state !== AnalyticsState.OptedIn) {
      this.guard();
      return;
    }
    const captured = [...waited, ...latest];
    if (captured.length === 0) return;
    // Made (or restored) here, after consent; the session id is never stored.
    this.anonymousId ??= this.identity.read()?.anonymousId ?? analyticsId("anon_");
    this.sessionId ??= analyticsId("ses_");
    if (this.state === AnalyticsState.OptedIn) this.remember();
    this.stopGuarding ??= this.ledger.subscribe(() => this.guard());
    const ids = { anonymousId: this.anonymousId, sessionId: this.sessionId };
    const deliveries = captured
      .map((delivery) => ({ ...delivery, ...ids }))
      .filter((delivery) => this.sampled(delivery));
    if (lane.primary) this.restore(lane);
    for (const delivery of deliveries)
      if (lane.buffer.length < this.config.bufferLimit) lane.buffer.push(delivery);
    this.schedule(lane);
  }

  /** Whether `delivery` is in the sample: `identify` and `group` always, an event by its rate for this visitor. */
  private sampled(delivery: AnalyticsDelivery): boolean {
    if ((delivery.kind ?? AnalyticsDeliveryKind.Track) !== AnalyticsDeliveryKind.Track) return true;
    const own = this.config.sampleRates[delivery.name];
    if (own !== undefined) return sampleScore(`${delivery.anonymousId}|${delivery.name}`) < own;
    return sampleScore(delivery.anonymousId) < this.config.sampleRate;
  }

  /** Sends `lane`'s buffer now when full or the window is zero, else once the window passes; never during a backoff. */
  private schedule(lane: AnalyticsLane): void {
    this.hookPageHide();
    if (lane.buffer.length === 0 || (lane.failures > 0 && lane.timer !== null)) return;
    if (lane.buffer.length >= this.config.flushAt || this.config.flushIntervalMs === 0) {
      void this.flushLane(lane);
      return;
    }
    lane.timer ??= setTimeout(() => void this.flushLane(lane), this.config.flushIntervalMs);
  }

  /** Sends `lane`'s buffer as one batch; a failure puts it back for a retry. */
  private async flushLane(lane: AnalyticsLane): Promise<void> {
    this.clearTimer(lane);
    const batch = lane.buffer.splice(0);
    if (batch.length === 0) return;
    try {
      await lane.driver.send(batch);
      lane.failures = 0;
      if (lane.buffer.length > 0) this.schedule(lane);
    } catch {
      this.retry(lane, batch);
    }
  }

  /**
   * A failed `batch`: back to the front within the bound and retried after backoff, or, once spent, kept offline
   * (the `default` destination) or dropped.
   */
  private retry(lane: AnalyticsLane, batch: readonly AnalyticsDelivery[]): void {
    lane.failures += 1;
    if (lane.failures > this.config.retryAttempts) {
      lane.failures = 0;
      this.keep(lane, batch);
      if (lane.buffer.length > 0) this.schedule(lane);
      return;
    }
    lane.buffer.unshift(...batch);
    lane.buffer.length = Math.min(lane.buffer.length, this.config.bufferLimit);
    this.clearTimer(lane);
    const wait = backoffDelay(
      {
        base: Duration.seconds(this.config.retryBaseMs / 1000),
        max: Duration.seconds(this.config.retryMaxMs / 1000),
        jitter: Jitter.Equal,
      },
      lane.failures,
    );
    lane.timer = setTimeout(() => void this.flushLane(lane), wait);
  }

  /**
   * Keeps an undelivered `batch` for the next launch.
   * shortcut: only the `default` destination has an offline queue (the port keeps one list); a named destination
   * drops a spent batch. Upgrade with a per-destination offline key when a host needs it.
   */
  private keep(lane: AnalyticsLane, batch: readonly AnalyticsDelivery[]): void {
    if (lane.primary) this.offline.save([...this.offline.load(), ...batch]);
  }

  /** Once per launch, after consent: what an earlier launch could not deliver goes to the front of the buffer. */
  private restore(lane: AnalyticsLane): void {
    if (this.restored) return;
    this.restored = true;
    const saved = this.offline.load();
    if (saved.length === 0) return;
    this.offline.clear();
    lane.buffer.unshift(...saved);
    lane.buffer.length = Math.min(lane.buffer.length, this.config.bufferLimit);
  }

  /** When the page hides or closes, every buffer leaves at once: by beacon when the driver can, else by `send`. */
  private hookPageHide(): void {
    if (this.hooked) return;
    this.hooked = true;
    const scope = globalThis as {
      readonly addEventListener?: (type: string, listener: () => void) => void;
      readonly document?: { readonly visibilityState?: string };
    };
    if (typeof scope.addEventListener !== "function") return;
    const leave = (): void => {
      for (const lane of this.lanes) this.leave(lane);
    };
    scope.addEventListener("pagehide", leave);
    scope.addEventListener("visibilitychange", () => {
      if (scope.document?.visibilityState === "hidden") leave();
    });
  }

  /** Hands `lane`'s whole buffer to its driver for a closing page; what neither path takes is kept offline. */
  private leave(lane: AnalyticsLane): void {
    this.clearTimer(lane);
    const batch = lane.buffer.splice(0);
    if (batch.length === 0) return;
    let handed: boolean;
    try {
      handed = lane.driver.beacon(batch);
    } catch {
      handed = false;
    }
    if (handed) return;
    lane.driver.send(batch).catch(() => this.keep(lane, batch));
  }

  /** Stops `lane`'s pending flush or retry. */
  private clearTimer(lane: AnalyticsLane): void {
    if (lane.timer !== null) clearTimeout(lane.timer);
    lane.timer = null;
  }

  /** Keeps the identity while `consentCategory` holds. */
  private remember(): void {
    if (this.anonymousId === null) return;
    const record = { anonymousId: this.anonymousId, ...this.who() };
    const text = JSON.stringify(record);
    // Written only when it changed, so a busy page does not rewrite the cookie on every send.
    if (text !== this.kept) this.identity.write(record);
    this.kept = text;
  }

  /**
   * After a ledger change: drops the buffer of every destination no longer granted (and the offline queue with the
   * `default` one), removes the kept identity once `consentCategory` is no longer granted, and the in-memory ids
   * once no destination is granted, so nothing kept survives a refusal.
   */
  private guard(): void {
    let anyGranted = false;
    for (const lane of this.lanes) {
      const status = this.stateOf(lane.category);
      if (status === AnalyticsState.OptedIn) {
        anyGranted = true;
        continue;
      }
      this.clearTimer(lane);
      lane.buffer.length = 0;
      lane.failures = 0;
      // An undecided default destination keeps an earlier launch's batches until the visitor answers.
      if (lane.primary && status === AnalyticsState.OptedOut) this.offline.clear();
    }
    const state = this.state;
    // A decided refusal clears an identity an earlier launch kept; an undecided one only what this launch wrote.
    if (
      state === AnalyticsState.OptedOut ||
      (state === AnalyticsState.Pending && this.kept !== null)
    ) {
      this.kept = null;
      this.identity.clear();
    }
    if (anyGranted) return;
    this.stopGuarding?.();
    this.stopGuarding = null;
    this.anonymousId = null;
    this.sessionId = null;
  }

  /** An `identify` or `group` delivery, captured now with the current identity. */
  private linkOf(
    kind: AnalyticsDeliveryKind,
    name: string,
    properties: Readonly<Record<string, string>>,
  ): Captured {
    return {
      ...this.who(),
      eventId: analyticsId("evt_"),
      kind,
      name,
      properties,
      occurredAt: new Date().toISOString(),
      context: this.contextOf(),
    };
  }

  /** The user id and groups the visitor has now, as a delivery carries them. */
  private who(): Pick<Captured, "userId" | "groups"> {
    return {
      ...(this.userId === null ? {} : { userId: this.userId }),
      ...(Object.keys(this.groups).length === 0 ? {} : { groups: this.groups }),
    };
  }

  /**
   * The delivery of `event` without the visitor ids: a new event id, its locked name, the fields its schema declares
   * minus the deny list, the time now and the capture context.
   */
  private deliveryOf(event: Event): Captured {
    const type = event.constructor as AnyClass;
    const record = kindOf(type);
    if (record?.kind !== "analytics_event")
      throw new TypeError(
        `track() takes an AnalyticsEvent instance, got ${type.name || "an object"}`,
      );
    // Parsing again drops any field the schema does not declare, so nothing undeclared leaves the device.
    const fields = schemaOf(type).parse({ ...event }) as Record<string, unknown>;
    const denied = new Set(this.config.denyProperties);
    return {
      ...this.who(),
      eventId: analyticsId("evt_"),
      kind: AnalyticsDeliveryKind.Track,
      name: String(record.options.name),
      properties: Object.fromEntries(Object.entries(fields).filter(([key]) => !denied.has(key))),
      occurredAt: new Date().toISOString(),
      context: this.contextOf(),
    };
  }

  /** Where the event is captured: the library, and the page path and locale when the platform has them. */
  private contextOf(): AnalyticsContext {
    // Absent on the server and in React Native, so read through an optional view of the globals.
    const scope = globalThis as {
      readonly location?: { readonly pathname?: string };
      readonly navigator?: { readonly language?: string };
    };
    const path = scope.location?.pathname;
    const locale = scope.navigator?.language;
    return {
      library: { name: LIBRARY },
      ...(path ? { page: { path } } : {}),
      ...(locale ? { locale } : {}),
    };
  }
}
