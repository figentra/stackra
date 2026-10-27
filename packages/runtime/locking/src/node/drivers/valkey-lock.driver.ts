/**
 * Stackra file contract:
 * Purpose: `ValkeyLockDriver`, the Valkey driver of the `LockDriver` port (driver name `valkey`): each key is a Valkey
 *          string holding `<owner>:<token>` with a `PX` lifetime, all keys of a lease taken, renewed and released in one
 *          script so a lease is all or nothing; the fencing token comes from one counter key.
 * Boundary: the server is the `LOCKING_VALKEY_URL` secret; every key is `locking.valkey.keyPrefix` plus the lock key.
 *           The scripts touch several keys, so the server is one endpoint (or every key shares a hash tag), not a
 *           sharded cluster. Unlike Postgres advisory locks, a lease here ends with its TTL, so `Locks`' renewal timer
 *           keeps it; `renew` and `release` act only while the key still holds this lease's value, so a lapsed holder
 *           never frees or extends the next holder's lock. `within` runs the work as it is: there is no transaction to
 *           join. A command is retried once, then rejects.
 * Runtime: node
 * Governing contract: ADR 0103 (decision 2: a Redis/Valkey driver); ADR 0149 (decisions 1 to 3: TTL with renew,
 *                     fencing tokens); ADR 0173 (secrets by name); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import Valkey from "iovalkey";

import type { LockingConfig } from "#config/locking.config";
import { LockDriver } from "#contracts/index";
import type { LockLease } from "#contracts/index";

/** KEYS[1] is the token counter, KEYS[2..] the locks; ARGV owner, ttl ms. The token, or 0 when a key is held. */
const ACQUIRE = `
for i = 2, #KEYS do
  if redis.call('exists', KEYS[i]) == 1 then return 0 end
end
local token = redis.call('incr', KEYS[1])
for i = 2, #KEYS do
  redis.call('set', KEYS[i], ARGV[1] .. ':' .. token, 'PX', ARGV[2])
end
return token`;

/** KEYS the locks; ARGV value, ttl ms. 1 when every key still held the value and was extended, else 0. */
const RENEW = `
for i = 1, #KEYS do
  if redis.call('get', KEYS[i]) ~= ARGV[1] then return 0 end
end
for i = 1, #KEYS do
  redis.call('pexpire', KEYS[i], ARGV[2])
end
return 1`;

/** KEYS the locks; ARGV value. Deletes each key that still holds the value. */
const RELEASE = `
for i = 1, #KEYS do
  if redis.call('get', KEYS[i]) == ARGV[1] then redis.call('del', KEYS[i]) end
end
return 1`;

/**
 * Locks in Valkey.
 *
 * @example
 * // runway.yaml (staging): config.locking: { driver: valkey, valkey: { keyPrefix: "commerce:lock:" } }
 * await locks.with(keys, Duration.seconds(5), () => stock.reserve(lines));
 */
export class ValkeyLockDriver extends Driver(LockDriver) {
  /** The client every call goes through. */
  readonly client: Valkey;

  private readonly prefix: string;

  /**
   * @param config - the server (`valkeyUrl`, the `LOCKING_VALKEY_URL` secret) and the key prefix.
   * @throws TypeError when the `LOCKING_VALKEY_URL` secret is not set.
   */
  constructor(config: LockingConfig) {
    super();
    if (config.valkeyUrl === "")
      throw new TypeError(
        "The valkey lock driver needs a server: set the LOCKING_VALKEY_URL secret",
      );
    this.prefix = config.valkey.keyPrefix;
    this.client = new Valkey(config.valkeyUrl, { maxRetriesPerRequest: 1 });
  }

  /** Runs `work` as it is: Valkey locks need no transaction. */
  within<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  /** Implements `LockDriver.tryAcquire`, documented there. */
  async tryAcquire(
    keys: readonly string[],
    owner: string,
    ttl: Duration,
  ): Promise<LockLease | undefined> {
    const names = keys.map((key) => this.prefix + key);
    const token = Number(
      await this.client.eval(
        ACQUIRE,
        names.length + 1,
        `${this.prefix}~tokens`,
        ...names,
        owner,
        String(this.milliseconds(ttl)),
      ),
    );
    return token > 0 ? { keys: [...keys], owner, token } : undefined;
  }

  /** Implements `LockDriver.renew`, documented there. */
  async renew(lease: LockLease, ttl: Duration): Promise<boolean> {
    const names = lease.keys.map((key) => this.prefix + key);
    const renewed = await this.client.eval(
      RENEW,
      names.length,
      ...names,
      `${lease.owner}:${lease.token}`,
      String(this.milliseconds(ttl)),
    );
    return Number(renewed) === 1;
  }

  /** Implements `LockDriver.release`, documented there. */
  async release(lease: LockLease): Promise<void> {
    const names = lease.keys.map((key) => this.prefix + key);
    await this.client.eval(RELEASE, names.length, ...names, `${lease.owner}:${lease.token}`);
  }

  /** `ttl` in whole milliseconds, at least one. */
  private milliseconds(ttl: Duration): number {
    return Math.max(1, Math.ceil(Duration.toMilliseconds(ttl)));
  }
}
