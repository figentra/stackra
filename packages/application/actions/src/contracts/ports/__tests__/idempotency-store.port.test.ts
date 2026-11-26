/**
 * Stackra file contract:
 * Purpose: unit tests of the `IdempotencyStore` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver claims, extends, completes and releases keys.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { Duration, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { StoredRefusal } from "@stackra/errors";
import type { IdempotencyRecord } from "#contracts/types/idempotency-record.type";
import { IdempotencyStore } from "#contracts/ports/idempotency-store.port";

class MapDriver extends Driver(IdempotencyStore) {
  readonly records = new Map<string, IdempotencyRecord>();

  async claim(
    key: string,
    fingerprint: string,
    _ttl: Duration,
  ): Promise<IdempotencyRecord | undefined> {
    const known = this.records.get(key);
    if (known !== undefined) return known;
    this.records.set(key, { fingerprint, done: false });
    return undefined;
  }

  async extend(key: string, fingerprint: string): Promise<boolean> {
    const known = this.records.get(key);
    if (known?.done === true || (known !== undefined && known.fingerprint !== fingerprint))
      return false;
    this.records.set(key, { fingerprint, done: false });
    return true;
  }

  async complete(key: string, fingerprint: string, output: unknown): Promise<void> {
    this.records.set(key, { fingerprint, done: true, output });
  }

  async completeRefused(
    key: string,
    fingerprint: string,
    refusal: StoredRefusal,
    _ttl: Duration,
  ): Promise<void> {
    this.records.set(key, { fingerprint, done: true, refusal });
  }

  async release(key: string): Promise<void> {
    this.records.delete(key);
  }
}

describe("IdempotencyStore", () => {
  it("is an abstract port", () => {
    expect(IdempotencyStore.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver: IdempotencyStore = new MapDriver();
    expect(await driver.claim("k", "f", Duration.hours(24), "h")).toBeUndefined();
    expect(await driver.claim("k", "f", Duration.hours(24), "h")).toEqual({
      fingerprint: "f",
      done: false,
    });
    expect(await driver.extend("k", "f", Duration.hours(24), "h")).toBe(true);
    await driver.complete("k", "f", { orderId: "ord_1" }, Duration.hours(24), "h");
    expect(await driver.extend("k", "f", Duration.hours(24), "h")).toBe(false);
    expect(await driver.claim("k", "f", Duration.hours(24), "h")).toEqual({
      fingerprint: "f",
      done: true,
      output: { orderId: "ord_1" },
    });
    await driver.release("k", "h");
    expect(await driver.claim("k", "g", Duration.hours(24), "h")).toBeUndefined();
  });
});
