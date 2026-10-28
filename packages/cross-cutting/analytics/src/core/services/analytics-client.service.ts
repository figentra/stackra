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
 *           are never sampled. A refusal drops the buffer and the offline queue.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 2 and 5); ADR 0071 (no identifier before consent); ADR 0305 (rule 20);
 *                     ADR 0294 (decisions 16, 17 and 26); analytics gaps 5 and 6 (identity stitching, stackra-405; the
 *                     delivery engine, stackra-406); owner D10 2026-10-28 (one backoff formula).
 */
import type { ConsentLedger } from "@stackra/consent";
import { ConsentStatus } from "@stackra/consent";
import { type AnyClass, kindOf, Service } from "@stackra/container";
import { backoffDelay, Duration, Jitter } from "@stackra/contracts";
import type { Event } from "@stackra/events";
import { schemaOf } from "@stackra/validation";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import type { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import type { AnalyticsContext } from "#contracts/types/analytics-context.type";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { AnalyticsState } from "#core/enums/analytics-state.enum";
import { MemoryAnalyticsIdentityDriver } from "#core/drivers/memory-analytics-identity.driver";
import { NoneAnalyticsOfflineQueueDriver } from "#core/drivers/none-analytics-offline-queue.driver";
import { analyticsId } from "#core/functions/analytics-id.function";
import { sampleScore } from "#core/functions/sample-score.function";

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

  private readonly driver: AnalyticsDriver;

  private readonly ledger: ConsentLedger;

  private readonly identity: AnalyticsIdentity;

  private readonly queue: Captured[] = [];

  private anonymousId: string | null = null;

  private sessionId: string | null = null;

  private userId: string | null = null;

  private groups: Readonly<Record<string, string>> = {};

  private stopWatching: (() => void) | null = null;

  private stopGuarding: (() => void) | null = null;

  private kept: string | null = null;

  private readonly offline: AnalyticsOfflineQueue;

  private readonly buffer: AnalyticsDelivery[] = [];

  private timer: ReturnType<typeof setTimeout> | null = null;

  private failures = 0;

  private restored = false;

  private hooked = false;

  /**
   * @param config - the driver, the gating category, the queue bound and the deny list.
   * @param driver - the selected driver that sends.
   * @param ledger - the consent ledger that decides.
   * @param identity - where the visitor's identity is kept after consent; in memory for this launch when absent.
   * @param offline - where undelivered batches wait for the next launch; nothing is kept when absent.
   */
  constructor(
    config: AnalyticsConfig,
    driver: AnalyticsDriver,
    ledger: ConsentLedger,
    identity: AnalyticsIdentity = new MemoryAnalyticsIdentityDriver(),
    offline: AnalyticsOfflineQueue = new NoneAnalyticsOfflineQueueDriver(),
  ) {
    super();
    this.config = config;
    this.driver = driver;
    this.ledger = ledger;
    this.identity = identity;
    this.offline = offline;
  }

  /** Where delivery stands: the consent status of `AnalyticsConfig.consentCategory`, read now. */
  get state(): AnalyticsState {
    const status = this.ledger.status(this.config.consentCategory);
    if (status === ConsentStatus.Granted) return AnalyticsState.OptedIn;
    return status === ConsentStatus.Denied ? AnalyticsState.OptedOut : AnalyticsState.Pending;
  }

  /**
   * Sends `event` once its consent category allows: at once when granted, after the visitor accepts when undecided
   * (if the queue has room), never when refused.
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
   * Sends everything buffered now, in one batch (a host calls it before a known exit; the engine calls it at
   * `flushAt` or after `flushIntervalMs`). A failure puts the batch back for a retry and never rejects.
   */
  async flush(): Promise<void> {
    this.clearTimer();
    const batch = this.buffer.splice(0);
    if (batch.length === 0) return;
    try {
      await this.driver.send(batch);
      this.failures = 0;
      if (this.buffer.length > 0) this.schedule();
    } catch {
      this.retry(batch);
    }
  }

  /** Sends `delivery` now, queues it while undecided, or drops it on refusal. */
  private enqueue(delivery: Captured): void {
    if (this.state !== AnalyticsState.Pending) {
      this.settle([delivery]);
      return;
    }
    if (this.queue.length < this.config.queueLimit) this.queue.push(delivery);
    this.stopWatching ??= this.ledger.subscribe(() => this.settle([]));
  }

  /** Once decided: sends what waited, then `latest`, on acceptance; drops both on refusal. Undecided keeps waiting. */
  private settle(latest: readonly Captured[]): void {
    const state = this.state;
    if (state === AnalyticsState.Pending) return;
    const waited = this.queue.splice(0);
    this.stopWatching?.();
    this.stopWatching = null;
    if (state !== AnalyticsState.OptedIn) {
      this.forget();
      return;
    }
    const captured = [...waited, ...latest];
    if (captured.length === 0) return;
    // Made (or restored) here, after consent; the session id is never stored.
    this.anonymousId ??= this.identity.read()?.anonymousId ?? analyticsId("anon_");
    this.sessionId ??= analyticsId("ses_");
    this.remember();
    const ids = { anonymousId: this.anonymousId, sessionId: this.sessionId };
    const deliveries = captured
      .map((delivery) => ({ ...delivery, ...ids }))
      .filter((delivery) => this.sampled(delivery));
    this.restore();
    for (const delivery of deliveries)
      if (this.buffer.length < this.config.bufferLimit) this.buffer.push(delivery);
    this.schedule();
  }

  /** Whether `delivery` is in the sample: `identify` and `group` always, an event by its rate for this visitor. */
  private sampled(delivery: AnalyticsDelivery): boolean {
    if ((delivery.kind ?? AnalyticsDeliveryKind.Track) !== AnalyticsDeliveryKind.Track) return true;
    const own = this.config.sampleRates[delivery.name];
    if (own !== undefined) return sampleScore(`${delivery.anonymousId}|${delivery.name}`) < own;
    return sampleScore(delivery.anonymousId) < this.config.sampleRate;
  }

  /** Sends the buffer now when it is full or the window is zero, else once the window passes; never during a backoff. */
  private schedule(): void {
    this.hookPageHide();
    if (this.buffer.length === 0 || (this.failures > 0 && this.timer !== null)) return;
    if (this.buffer.length >= this.config.flushAt || this.config.flushIntervalMs === 0) {
      void this.flush();
      return;
    }
    this.timer ??= setTimeout(() => void this.flush(), this.config.flushIntervalMs);
  }

  /** A failed `batch`: back to the front within the bound and retried after backoff, or kept offline once spent. */
  private retry(batch: readonly AnalyticsDelivery[]): void {
    this.failures += 1;
    if (this.failures > this.config.retryAttempts) {
      this.failures = 0;
      this.offline.save([...this.offline.load(), ...batch]);
      if (this.buffer.length > 0) this.schedule();
      return;
    }
    this.buffer.unshift(...batch);
    this.buffer.length = Math.min(this.buffer.length, this.config.bufferLimit);
    this.clearTimer();
    const wait = backoffDelay(
      {
        base: Duration.seconds(this.config.retryBaseMs / 1000),
        max: Duration.seconds(this.config.retryMaxMs / 1000),
        jitter: Jitter.Equal,
      },
      this.failures,
    );
    this.timer = setTimeout(() => void this.flush(), wait);
  }

  /** Once per launch, after consent: what an earlier launch could not deliver goes to the front of the buffer. */
  private restore(): void {
    if (this.restored) return;
    this.restored = true;
    const saved = this.offline.load();
    if (saved.length === 0) return;
    this.offline.clear();
    this.buffer.unshift(...saved);
    this.buffer.length = Math.min(this.buffer.length, this.config.bufferLimit);
  }

  /** When the page hides or closes, the buffer leaves at once: by beacon when the driver can, else by `send`. */
  private hookPageHide(): void {
    if (this.hooked) return;
    this.hooked = true;
    const scope = globalThis as {
      readonly addEventListener?: (type: string, listener: () => void) => void;
      readonly document?: { readonly visibilityState?: string };
    };
    if (typeof scope.addEventListener !== "function") return;
    const leave = (): void => this.leave();
    scope.addEventListener("pagehide", leave);
    scope.addEventListener("visibilitychange", () => {
      if (scope.document?.visibilityState === "hidden") leave();
    });
  }

  /** Hands the whole buffer to the driver for a closing page; what neither path takes is kept offline. */
  private leave(): void {
    this.clearTimer();
    const batch = this.buffer.splice(0);
    if (batch.length === 0) return;
    let handed: boolean;
    try {
      handed = this.driver.beacon(batch);
    } catch {
      handed = false;
    }
    if (handed) return;
    this.driver.send(batch).catch(() => this.offline.save([...this.offline.load(), ...batch]));
  }

  /** Stops a pending flush or retry. */
  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  /** Keeps the identity while consent holds, and watches the ledger so a later refusal removes it at once. */
  private remember(): void {
    if (this.anonymousId === null) return;
    const record = { anonymousId: this.anonymousId, ...this.who() };
    const text = JSON.stringify(record);
    // Written only when it changed, so a busy page does not rewrite the cookie on every send.
    if (text !== this.kept) this.identity.write(record);
    this.kept = text;
    this.stopGuarding ??= this.ledger.subscribe(() => {
      if (this.state !== AnalyticsState.OptedIn) this.forget();
    });
  }

  /** Removes the kept identity after a refusal; the in-memory ids go too, so nothing kept survives the refusal. */
  private forget(): void {
    this.stopGuarding?.();
    this.stopGuarding = null;
    this.clearTimer();
    this.buffer.length = 0;
    this.failures = 0;
    this.offline.clear();
    this.anonymousId = null;
    this.sessionId = null;
    this.kept = null;
    this.identity.clear();
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
