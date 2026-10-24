/**
 * Stackra file contract:
 * Purpose: unit tests of the `IdempotencyStore` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver claims, completes and releases keys.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

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

  async complete(key: string, output: unknown): Promise<void> {
    const known = this.records.get(key);
    if (known !== undefined)
      this.records.set(key, { fingerprint: known.fingerprint, done: true, output });
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
    const driver = new MapDriver();
    expect(await driver.claim("k", "f", Duration.hours(24))).toBeUndefined();
    expect(await driver.claim("k", "f", Duration.hours(24))).toEqual({
      fingerprint: "f",
      done: false,
    });
    await driver.complete("k", { orderId: "ord_1" });
    expect(await driver.claim("k", "f", Duration.hours(24))).toEqual({
      fingerprint: "f",
      done: true,
      output: { orderId: "ord_1" },
    });
    await driver.release("k");
    expect(await driver.claim("k", "g", Duration.hours(24))).toBeUndefined();
  });
});
