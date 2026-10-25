/**
 * Stackra file contract:
 * Purpose: `OfflineLock`, revoke means wipe and lock (ADR 0338 decision 4): when identity revokes the device's session,
 *          or when the offline limit (`QuerySettings.offlineLimitHours`, 24 hours by default) passes without a sync, it
 *          tells the queue, the cache and the replicas to drop what they hold, wipes the `outbox`, `cache` and `secrets`
 *          areas, and stays locked until someone signs in again (or a sync succeeds). A sync is an answer to the
 *          device's last acknowledged sequence (`AcknowledgementReader`), asked on start, on every reconnect, on every
 *          sign-in and when the limit falls due, so an idle device that is online never wipes.
 * Boundary: a singleton service the host's query context starts once (`start()`). The listeners (`onWipe`) run and
 *           settle before the areas are cleared, so no write they had in flight lands after the wipe; a listener's
 *           failure never stops the wipe. A wipe past the offline limit also ends the session on the device, so only a
 *           new sign-in unlocks it; a revoke leaves identity's `revoked` state for the screen to show. Either wipe takes
 *           the stored credentials with `secrets`, so the sign-in that unlocks is a fresh one. A revoked device's unsent
 *           calls are lost by design (the server lists its last acknowledged sequence, `lastAcknowledged`). The
 *           countdown starts the first time the lock sees the device and again after a wipe (a failed sync right after
 *           the unlocking sign-in never wipes at once), and a failed settings read falls back to the default limit, so
 *           a missing settings store never disables the wipe.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 2 and 4); ADR 0256 (the areas); ADR 0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { DeviceIdentity } from "@stackra/devices/contracts";
import { Platform } from "@stackra/platform/contracts";
import { SettingsReader } from "@stackra/settings";
import { Storage } from "@stackra/storage/contracts";

import { AcknowledgementReader } from "#contracts/ports/acknowledgement-reader.port";
import { OfflineSession } from "#contracts/ports/offline-session.port";
import { QuerySettings } from "#core/query.settings";

/** The `prefs` key of the last sync's time; no secret, so it lives in `prefs`, and a wipe removes it. */
const LAST_SYNC_KEY = "query.last_synced_at";

/** `QuerySettings.offlineLimitHours`' default, used when the settings cannot be read. */
const DEFAULT_LIMIT_HOURS = 24;

/** The longest delay a timer takes. */
const MAX_DELAY_MS = 2 ** 31 - 1;

/**
 * Wipes and locks the device's offline data on revoke or past the offline limit.
 *
 * @example
 * lock.onWipe(() => queue.close());
 * lock.start(); // once, from the query context
 */
export class OfflineLock extends Service {
  private readonly storage: Storage;

  private readonly session: OfflineSession;

  private readonly reader: AcknowledgementReader;

  private readonly device: DeviceIdentity;

  private readonly settings: SettingsReader;

  private readonly platform: Platform;

  private readonly clock: Clock;

  private readonly listeners = new Set<() => void | Promise<void>>();

  private stops: readonly (() => void)[] = [];

  private timer: ReturnType<typeof setTimeout> | undefined;

  private locked = false;

  private acknowledged: number | null = null;

  private wiping: Promise<void> | undefined;

  /**
   * @param storage - the areas it wipes, and `prefs` for the last sync's time.
   * @param session - the revoked and signed-in signals, and the local sign-out.
   * @param reader - the server's answer that proves a sync.
   * @param device - this device's id, for the read.
   * @param settings - the offline limit.
   * @param platform - the network signal.
   * @param clock - measures the limit.
   */
  constructor(
    storage: Storage,
    session: OfflineSession,
    reader: AcknowledgementReader,
    device: DeviceIdentity,
    settings: SettingsReader,
    platform: Platform,
    clock: Clock,
  ) {
    super();
    this.storage = storage;
    this.session = session;
    this.reader = reader;
    this.device = device;
    this.settings = settings;
    this.platform = platform;
    this.clock = clock;
  }

  /** True from a wipe until someone signs in again or a sync succeeds. */
  get isLocked(): boolean {
    return this.locked;
  }

  /** When the device last synced, or `null` before the countdown started. */
  get lastSyncedAt(): Date | null {
    const stored = this.storage.prefs.get(LAST_SYNC_KEY);
    return typeof stored === "string" && !Number.isNaN(Date.parse(stored))
      ? new Date(stored)
      : null;
  }

  /** The server's last acknowledged sequence for this device as of the last sync; `null` before one or when none. */
  get lastAcknowledged(): number | null {
    return this.acknowledged;
  }

  /**
   * Calls `listener` at the start of every wipe and waits for it before the areas are cleared.
   *
   * @returns removes the listener.
   */
  onWipe(listener: () => void | Promise<void>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Starts watching the session and the network, and checks the limit now; later calls do nothing. */
  start(): void {
    if (this.stops.length > 0) return;
    this.stops = [
      this.session.isRevoked.subscribe((isRevoked) => {
        if (isRevoked) void this.wipe();
      }),
      this.session.isSignedIn.subscribe((isSignedIn) => {
        if (!isSignedIn) return;
        this.locked = false;
        void this.check(true);
      }),
      this.platform.network.isOnline.subscribe((isOnline) => {
        if (isOnline) void this.check(true);
      }),
    ];
    if (this.session.isRevoked.get()) void this.wipe();
    else void this.check(this.platform.network.isOnline.get());
  }

  /**
   * Asks the server for the device's last acknowledged sequence; an answer is a sync, which records its time and lifts
   * the lock.
   *
   * @throws Error the reader's failure; nothing changes then.
   */
  async sync(): Promise<number | null> {
    const acknowledged = await this.reader.lastAcknowledged(await this.device.id());
    this.acknowledged = acknowledged;
    this.locked = false;
    this.storage.prefs.set(LAST_SYNC_KEY, this.clock.now().toISOString());
    return acknowledged;
  }

  /**
   * Wipes when the offline limit has passed and a sync fails now; otherwise schedules the next check for when the limit
   * falls due. A locked device is not wiped again: it waits for a sync.
   *
   * @param trySync - sync first even before the limit (start, reconnect, sign-in).
   */
  async check(trySync = false): Promise<void> {
    clearTimeout(this.timer);
    this.timer = undefined;
    const hours = await this.settings.get(QuerySettings).then(
      (settings) => settings.offlineLimitHours,
      () => DEFAULT_LIMIT_HOURS,
    );
    const limit = Duration.toMilliseconds(Duration.hours(hours));
    const now = this.clock.now().getTime();
    let synced = this.lastSyncedAt?.getTime();
    if (synced === undefined) {
      this.storage.prefs.set(LAST_SYNC_KEY, new Date(now).toISOString());
      synced = now;
    }
    if (trySync || now - synced >= limit) {
      try {
        await this.sync();
        synced = this.clock.now().getTime();
      } catch {
        if (now - synced >= limit && !this.locked) return this.erase(true);
      }
    }
    if (this.locked) return;
    const delay = Math.min(MAX_DELAY_MS, Math.max(0, synced + limit - this.clock.now().getTime()));
    this.timer = setTimeout(() => void this.check(), delay);
  }

  /**
   * Wipes now and locks: every listener settles, then the `outbox`, `cache` and `secrets` areas are cleared and
   * flushed. A call during a wipe joins it.
   *
   * @throws Error the storage flush's failure; the memory copies are cleared even then.
   */
  wipe(): Promise<void> {
    return this.erase(false);
  }

  /** Stops watching and the pending check when the container closes. */
  onApplicationShutdown(): void {
    clearTimeout(this.timer);
    for (const stop of this.stops) stop();
    this.stops = [];
  }

  /** One wipe, ending the session on the device when `endSession`. */
  private erase(endSession: boolean): Promise<void> {
    this.wiping ??= (async () => {
      this.locked = true;
      clearTimeout(this.timer);
      this.timer = undefined;
      await Promise.allSettled([...this.listeners].map(async (listener) => listener()));
      this.storage.outbox.clear();
      this.storage.cache.clear();
      this.storage.secrets.clear();
      this.storage.prefs.delete(LAST_SYNC_KEY);
      try {
        await this.storage.flush();
      } finally {
        if (endSession) await this.session.end();
      }
    })().finally(() => {
      this.wiping = undefined;
    });
    return this.wiping;
  }
}
