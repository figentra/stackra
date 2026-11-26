/**
 * Stackra file contract:
 * Purpose: integration tests of `ValkeyRateLimitStoreDriver` on a real Valkey: its token-bucket script as the server
 *          runs it. A bucket starts full, refuses once empty with the wait until the next token, refills with time up
 *          to its capacity, keeps fractional tokens between takes, never refills at rate 0 (and then never expires),
 *          expires once it would be full again, and concurrent takes from several instances never take more tokens than
 *          the bucket holds.
 * Boundary: integration tier (`.int`): needs Docker for the Testcontainers Valkey (`useValkey`). Each test uses a
 *           bucket of its own; `now` is passed in, as the pipeline's clock does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0217 (decision 2); ADR 0150 (the Valkey client); ADR 0182 (integration tier); STA-2802.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";

import { StoresConfig } from "#config/stores.config";
import { useValkey } from "#node/__tests__/fixtures/valkey.fixture";
import { ValkeyRateLimitStoreDriver } from "#node/drivers/valkey-rate-limit-store.driver";

const valkey = useValkey();

/** The fixture's server as the `ACTIONS_VALKEY_URL` secret. */
class StoreSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "ACTIONS_VALKEY_URL" ? valkey.url : undefined;
  }
}

/** A store over the fixture's server, as one instance of a service has; closed after the file. */
const store = (): ValkeyRateLimitStoreDriver =>
  valkey.track(
    new ValkeyRateLimitStoreDriver(
      buildConfig(StoresConfig, {
        values: { valkey: { keyPrefix: "it:" } },
        secrets: new StoreSecrets(),
      }),
    ),
  );

const start = new Date("2026-10-26T10:00:00.000Z");

/** `seconds` after the start. */
const at = (seconds: number): Date => new Date(start.getTime() + seconds * 1000);

/** `value`, which the test expects present. */
function taken<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("expected a value");
  return value;
}

describe(ValkeyRateLimitStoreDriver, () => {
  it("starts full, refuses once empty with the wait, and refills with time", async () => {
    const bucket = { capacity: 2, tokensPerSecond: 0.5 };
    const limits = store();
    await expect(limits.take("b1", bucket, at(0))).resolves.toEqual({
      allowed: true,
      remaining: 1,
      retryAfterMs: 0,
    });
    await expect(limits.take("b1", bucket, at(0))).resolves.toEqual({
      allowed: true,
      remaining: 0,
      retryAfterMs: 0,
    });
    await expect(limits.take("b1", bucket, at(0))).resolves.toEqual({
      allowed: false,
      remaining: 0,
      retryAfterMs: 2000,
    });
    await expect(limits.take("b1", bucket, at(1))).resolves.toMatchObject({
      allowed: false,
      retryAfterMs: 1000,
    });
    await expect(limits.take("b1", bucket, at(2))).resolves.toMatchObject({ allowed: true });
  });

  it("refills no further than the capacity", async () => {
    const bucket = { capacity: 3, tokensPerSecond: 10 };
    const limits = store();
    await limits.take("b2", bucket, at(0));
    await expect(limits.take("b2", bucket, at(3600))).resolves.toEqual({
      allowed: true,
      remaining: 2,
      retryAfterMs: 0,
    });
  });

  it("keeps fractional tokens between takes", async () => {
    const bucket = { capacity: 1, tokensPerSecond: 4 };
    const limits = store();
    await limits.take("b3", bucket, at(0));
    expect((await limits.take("b3", bucket, at(0.125))).retryAfterMs).toBe(125);
    expect((await limits.take("b3", bucket, at(0.25))).allowed).toBe(true);
  });

  it("never refills at rate 0, and such a bucket never expires", async () => {
    const bucket = { capacity: 1, tokensPerSecond: 0 };
    const limits = store();
    await limits.take("b4", bucket, at(0));
    await expect(limits.take("b4", bucket, at(3600))).resolves.toEqual({
      allowed: false,
      remaining: 0,
      retryAfterMs: Infinity,
    });
    expect(await valkey.client.pttl("it:rate:b4")).toBe(-1);
  });

  it("expires a bucket once it would be full again, plus a second", async () => {
    const bucket = { capacity: 4, tokensPerSecond: 2 };
    await store().take("b5", bucket, at(0));
    const lifetime = await valkey.client.pttl("it:rate:b5");
    expect(lifetime).toBeGreaterThan(1000);
    expect(lifetime).toBeLessThanOrEqual(1500);
  });

  it("never lets concurrent takes from several instances exceed the bucket", async () => {
    const bucket = { capacity: 5, tokensPerSecond: 0 };
    const instances = [store(), store(), store(), store()];
    const decisions = await Promise.all(
      Array.from({ length: 24 }, (_, index) =>
        taken(instances[index % 4]).take("b6", bucket, at(0)),
      ),
    );
    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(5);
  });
});
