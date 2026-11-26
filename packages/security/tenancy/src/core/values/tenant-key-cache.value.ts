/**
 * Stackra file contract:
 * Purpose: `TenantKeyCache`, the bounded cache of one value per tenant that a `KeyProvider` driver keeps its unwrapped
 *          keys in: each entry lives at most `seconds`, at most `tenants` entries are held (the least recently used
 *          leaves first), and a load in flight is shared, so two concurrent first seals of a tenant mint once.
 * Boundary: in process only; holds what it is given and never logs, lists or serialises an entry. A failed load is
 *           not kept, so a restored KMS grant works on the next call. `forget(tenantId)` drops a tenant (a rotation).
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (2026-11-09 amendment, point 2); ADR 0173 (nobody reads a value).
 */

/** One cached value and when it stops being served. */
interface Entry<T> {
  readonly value: Promise<T>;
  readonly expiresAt: number;
}

/**
 * A per-tenant cache with a lifetime and a size bound.
 * @example
 * const cache = new TenantKeyCache<KeyProvider>(300, 1000);
 * const keys = await cache.get(tenantId, () => load(tenantId));
 */
export class TenantKeyCache<T> {
  /** Entries by tenant, least recently used first (a `Map` keeps insertion order). */
  private readonly entries = new Map<string, Entry<T>>();

  /** How long an entry is served, in milliseconds. */
  private readonly lifetime: number;

  /** The most entries held. */
  private readonly size: number;

  /** The clock, in milliseconds; tests pass their own. */
  private readonly now: () => number;

  /**
   * @param seconds - how long an entry is served.
   * @param tenants - the most tenants held.
   * @param now - the clock, in milliseconds.
   */
  constructor(seconds: number, tenants: number, now: () => number = Date.now) {
    this.lifetime = seconds * 1000;
    this.size = tenants;
    this.now = now;
  }

  /** The tenant's value, loaded by `load` when it is missing or expired. */
  get(tenantId: string, load: () => Promise<T>): Promise<T> {
    const held = this.entries.get(tenantId);
    this.entries.delete(tenantId);
    if (held !== undefined && held.expiresAt > this.now()) {
      this.entries.set(tenantId, held);
      return held.value;
    }
    const value = load();
    this.entries.set(tenantId, { value, expiresAt: this.now() + this.lifetime });
    // a failed load is never served again
    value.catch(() => {
      if (this.entries.get(tenantId)?.value === value) this.entries.delete(tenantId);
    });
    while (this.entries.size > this.size) {
      const [oldest] = this.entries.keys();
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    return value;
  }

  /** Drops the tenant's entry, so the next call loads it again. */
  forget(tenantId: string): void {
    this.entries.delete(tenantId);
  }
}
