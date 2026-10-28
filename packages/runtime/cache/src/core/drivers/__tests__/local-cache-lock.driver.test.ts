/**
 * Stackra file contract:
 * Purpose: unit tests of `LocalCacheLockDriver`: it is a driver of the `CacheLock` port, it always runs the fill and
 *          answers `true`, and passes a rejection through.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decision 4).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheLock } from "#contracts/ports/cache-lock.port";
import { LocalCacheLockDriver } from "#core/drivers/local-cache-lock.driver";

describe("LocalCacheLockDriver", () => {
  it("is a driver of the CacheLock port", () => {
    expect(new LocalCacheLockDriver()).toBeInstanceOf(CacheLock);
  });

  it("always runs the fill and answers true", async () => {
    const lock = new LocalCacheLockDriver();
    const work = vi.fn(async () => undefined);
    await expect(lock.tryWith("cache.fill:/Product:1", Duration.seconds(5), work)).resolves.toBe(
      true,
    );
    expect(work).toHaveBeenCalledOnce();
  });

  it("passes a rejected fill through", async () => {
    const failure = new Error("database down");
    await expect(
      new LocalCacheLockDriver().tryWith("k", Duration.seconds(5), () => Promise.reject(failure)),
    ).rejects.toBe(failure);
  });
});
