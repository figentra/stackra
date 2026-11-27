/**
 * Stackra file contract:
 * Purpose: the Valkey driver of the `IdempotencyStore` port (driver name `valkey`): each scoped Idempotency-Key is one
 *          Valkey string holding its record as JSON (`fingerprint`, `done`, `output`), claimed atomically and expiring
 *          with its lease while held and with its replay window once done.
 * Boundary: the server is the `ACTIONS_VALKEY_URL` secret; every key is `actions.stores.valkey.keyPrefix` plus
 *           `idempotency:` plus the scoped key. `claim` is one script (read, or write the held record with `PX` for the
 *           lease), so two concurrent calls with one key never both run. A held record starts with its call's
 *           `holder` token (`{"holder":…,"fingerprint":…,"done":false}`), which no done record does, so the driver keeps
 *           no state of its own: `extend`, `complete` and `release` are scripts that act only while the stored value
 *           starts with this call's holder (or, for `extend` and `complete`, the key is free), so none touches a claim
 *           another call took after this one's lease lapsed, and a release never deletes a done record (STA-2797). The
 *           output must be JSON-serialisable, as every action output is. A command is retried once, then rejects. It
 *           cannot join a database transaction (`joinsTransaction` is false), so the pipeline `extend`s the claim to
 *           the replay window right before the commit (a lost claim rolls the call back), completes it after the
 *           commit, and refuses a call that joined an outer one (`idempotency_store_not_transactional`); use the
 *           Postgres store where the output must commit with the writes (ADR 0495, notes of 2026-11-01 and
 *           2026-11-26).
 * Runtime: node
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result, 24 hours); ADR 0150 (the Valkey client); ADR
 *                     0173 (secrets by name); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { StoredRefusal } from "@stackra/errors";
import Valkey from "iovalkey";

import type { StoresConfig } from "#config/stores.config";
import { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import type { IdempotencyRecord } from "#contracts/types/idempotency-record.type";

/** KEYS[1] the key; ARGV the held record, lease ms. The record already there, or false after holding the key. */
const CLAIM = `
local held = redis.call('get', KEYS[1])
if held then return held end
redis.call('set', KEYS[1], ARGV[1], 'PX', ARGV[2])
return false`;

/**
 * KEYS[1] the key; ARGV this call's holder prefix, the record to write, ttl ms. Writes the record (the held record
 * again for `extend`, the done record for `complete`) when the key still holds this call's claim or is free; 1 when
 * written, 0 when another call's claim or a done record is there.
 */
const WRITE_HELD = `
local now = redis.call('get', KEYS[1])
if now and string.sub(now, 1, #ARGV[1]) ~= ARGV[1] then return 0 end
redis.call('set', KEYS[1], ARGV[2], 'PX', ARGV[3])
return 1`;

/** KEYS[1] the key; ARGV[1] this call's holder prefix. Deletes the key only while it still holds this call's claim. */
const RELEASE = `
local now = redis.call('get', KEYS[1])
if now and string.sub(now, 1, #ARGV[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end
return 0`;

/** The start of every record `holder` holds: no done record starts this way. */
const prefixOf = (holder: string): string => `{"holder":${JSON.stringify(holder)},`;

/** The held record of `holder`'s claim, as stored: its holder first. */
const heldOf = (fingerprint: string, holder: string): string =>
  JSON.stringify({ holder, fingerprint, done: false });

/** Milliseconds of `duration`, at least one (`PX` refuses zero). */
const px = (duration: Duration): string =>
  String(Math.max(1, Math.ceil(Duration.toMilliseconds(duration))));

/**
 * Keeps Idempotency-Keys in Valkey.
 *
 * @example
 * // runway.yaml (production): config.actions.stores: { idempotency: valkey }
 * const earlier = await store.claim(key, fingerprint, Duration.minutes(15), holder);
 */
export class ValkeyIdempotencyStoreDriver extends Driver(IdempotencyStore) {
  /** The client every call goes through. */
  readonly client: Valkey;

  private readonly prefix: string;

  /**
   * @param config - the server (`valkeyUrl`, the `ACTIONS_VALKEY_URL` secret) and the key prefix.
   * @throws TypeError when the `ACTIONS_VALKEY_URL` secret is not set.
   */
  constructor(config: StoresConfig) {
    super();
    if (config.valkeyUrl === "")
      throw new TypeError(
        "The valkey idempotency store needs a server: set the ACTIONS_VALKEY_URL secret",
      );
    this.prefix = `${config.valkey.keyPrefix}idempotency:`;
    this.client = new Valkey(config.valkeyUrl, { maxRetriesPerRequest: 1 });
  }

  /** Claims `key` for `fingerprint` and `holder` in Valkey for `lease`; see `IdempotencyStore.claim`. */
  async claim(
    key: string,
    fingerprint: string,
    lease: Duration,
    holder: string,
  ): Promise<IdempotencyRecord | undefined> {
    const held = heldOf(fingerprint, holder);
    const earlier = await this.client.eval(CLAIM, 1, this.prefix + key, held, px(lease));
    if (typeof earlier === "string") return recordOf(earlier);
    return undefined;
  }

  /** Keeps `holder`'s claim (or a free key) held for `ttl`; see `IdempotencyStore.extend`. */
  async extend(key: string, fingerprint: string, ttl: Duration, holder: string): Promise<boolean> {
    const written = await this.client.eval(
      WRITE_HELD,
      1,
      this.prefix + key,
      prefixOf(holder),
      heldOf(fingerprint, holder),
      px(ttl),
    );
    return written === 1;
  }

  /** Marks `key` done with `output` for `ttl` while `holder` holds it or it is free; see `IdempotencyStore.complete`. */
  async complete(
    key: string,
    fingerprint: string,
    output: unknown,
    ttl: Duration,
    holder: string,
  ): Promise<void> {
    const record: IdempotencyRecord = { fingerprint, done: true, output: output ?? null };
    await this.client.eval(
      WRITE_HELD,
      1,
      this.prefix + key,
      prefixOf(holder),
      JSON.stringify(record),
      px(ttl),
    );
  }

  /** Writes the refusal that ended a call, claimed or not; see `IdempotencyStore.completeRefused`. */
  async completeRefused(
    key: string,
    fingerprint: string,
    refusal: StoredRefusal,
    ttl: Duration,
  ): Promise<void> {
    const record: IdempotencyRecord = { fingerprint, done: true, refusal };
    await this.client.set(
      this.prefix + key,
      JSON.stringify(record),
      "PX",
      Math.max(1, Math.ceil(Duration.toMilliseconds(ttl))),
    );
  }

  /** Frees `key` while it still holds `holder`'s claim; see `IdempotencyStore.release`. */
  async release(key: string, holder: string): Promise<void> {
    await this.client.eval(RELEASE, 1, this.prefix + key, prefixOf(holder));
  }
}

/** The record stored as `json`, without a held record's holder token. */
function recordOf(json: string): IdempotencyRecord {
  const stored = JSON.parse(json) as IdempotencyRecord & { readonly holder?: string };
  if (stored.done) return stored;
  return { fingerprint: stored.fingerprint, done: false };
}
