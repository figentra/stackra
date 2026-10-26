/**
 * Stackra file contract:
 * Purpose: the Valkey driver of the `IdempotencyStore` port (driver name `valkey`): each scoped Idempotency-Key is one
 *          Valkey string holding its record as JSON (`fingerprint`, `done`, `output`), claimed atomically and expiring
 *          with its TTL.
 * Boundary: the server is the `ACTIONS_VALKEY_URL` secret; every key is `actions.stores.valkey.keyPrefix` plus
 *           `idempotency:` plus the scoped key. `claim` is one script (read, or write the held record with `PX`), so
 *           two concurrent calls with one key never both run; `complete` keeps the claim's remaining lifetime
 *           (`KEEPTTL`, Valkey 7 / Redis 6 or later). The output must be JSON-serialisable, as every action output is.
 *           A command is retried once, then rejects.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result, 24 hours); ADR 0150 (the Valkey client); ADR
 *                     0173 (secrets by name); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import Valkey from "iovalkey";

import type { StoresConfig } from "#config/stores.config";
import { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import type { IdempotencyRecord } from "#contracts/types/idempotency-record.type";

/** KEYS[1] the key; ARGV the held record, ttl ms. The record already there, or false after holding the key. */
const CLAIM = `
local held = redis.call('get', KEYS[1])
if held then return held end
redis.call('set', KEYS[1], ARGV[1], 'PX', ARGV[2])
return false`;

/**
 * Keeps Idempotency-Keys in Valkey.
 *
 * @example
 * // runway.yaml (production): config.actions.stores: { idempotency: valkey }
 * const earlier = await store.claim(key, fingerprint, Duration.hours(24));
 */
export class ValkeyIdempotencyStoreDriver extends Driver(IdempotencyStore) {
  /** The client every call goes through. */
  readonly client: Valkey;

  private readonly prefix: string;

  /** Fingerprints of the keys this process holds, so `complete` writes the record whole. */
  private readonly held = new Map<string, string>();

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

  /** Claims `key` for `fingerprint` in Valkey; see `IdempotencyStore.claim`. */
  async claim(
    key: string,
    fingerprint: string,
    ttl: Duration,
  ): Promise<IdempotencyRecord | undefined> {
    const record: IdempotencyRecord = { fingerprint, done: false };
    const earlier = await this.client.eval(
      CLAIM,
      1,
      this.prefix + key,
      JSON.stringify(record),
      String(Math.max(1, Math.ceil(Duration.toMilliseconds(ttl)))),
    );
    if (typeof earlier === "string") return JSON.parse(earlier) as IdempotencyRecord;
    this.held.set(key, fingerprint);
    return undefined;
  }

  /** Marks the held `key` done with `output`; see `IdempotencyStore.complete`. */
  async complete(key: string, output: unknown): Promise<void> {
    const fingerprint = this.held.get(key);
    this.held.delete(key);
    if (fingerprint === undefined) return;
    const record: IdempotencyRecord = { fingerprint, done: true, output: output ?? null };
    await this.client.set(this.prefix + key, JSON.stringify(record), "KEEPTTL", "XX");
  }

  /** Frees the held `key` after a failed call; see `IdempotencyStore.release`. */
  async release(key: string): Promise<void> {
    this.held.delete(key);
    await this.client.del(this.prefix + key);
  }
}
