/**
 * Stackra file contract:
 * Purpose: integration tests of `ValkeyIdempotencyStoreDriver` on a real Valkey: its claim script and its writes as
 *          the server runs them. A claim holds a free key with the record and its TTL and answers the record another
 *          instance holds; of many instances racing on one key exactly one holds it; `complete` writes the record
 *          whole and keeps the claim's lifetime (`KEEPTTL`), never revives a key that lapsed (`XX`), and writes nothing
 *          for a key this instance does not hold; `completeRefused` writes the refusal with a fresh lifetime; `release`
 *          frees the key; a lapsed key is free to claim again.
 * Boundary: integration tier (`.int`): needs Docker for the Testcontainers Valkey (`useValkey`). Each test uses keys of
 *           its own. This is main's driver; the holder-token scripts of STA-2797 (PR #1092) need their own run of this
 *           file once that branch carries it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 3); ADR 0150 (the Valkey client); ADR 0173; ADR 0182 (integration tier);
 *                     STA-2802.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Duration } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { StoresConfig } from "#config/stores.config";
import { useValkey } from "#node/__tests__/fixtures/valkey.fixture";
import { ValkeyIdempotencyStoreDriver } from "#node/drivers/valkey-idempotency-store.driver";

const valkey = useValkey();

/** The fixture's server as the `ACTIONS_VALKEY_URL` secret. */
class StoreSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "ACTIONS_VALKEY_URL" ? valkey.url : undefined;
  }
}

/** A store over the fixture's server, as one instance of a service has; closed after the file. */
const store = (): ValkeyIdempotencyStoreDriver =>
  valkey.track(
    new ValkeyIdempotencyStoreDriver(
      buildConfig(StoresConfig, {
        values: { valkey: { keyPrefix: "it:" } },
        secrets: new StoreSecrets(),
      }),
    ),
  );

const DAY = Duration.hours(24);

/** The record stored under scoped key `key`, parsed. */
const stored = async (key: string): Promise<unknown> => {
  const text = await valkey.client.get(`it:idempotency:${key}`);
  return text === null ? undefined : JSON.parse(text);
};

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

describe(ValkeyIdempotencyStoreDriver, () => {
  it("holds a free key with its TTL and answers the held record to another instance", async () => {
    const first = store();
    await expect(first.claim("k1", "fp-1", DAY)).resolves.toBeUndefined();
    expect(await stored("k1")).toEqual({ fingerprint: "fp-1", done: false });
    const lifetime = await valkey.client.pttl("it:idempotency:k1");
    expect(lifetime).toBeGreaterThan(86_000_000);
    expect(lifetime).toBeLessThanOrEqual(86_400_000);
    await expect(store().claim("k1", "fp-other", DAY)).resolves.toEqual({
      fingerprint: "fp-1",
      done: false,
    });
    expect(await stored("k1")).toEqual({ fingerprint: "fp-1", done: false });
  });

  it("lets exactly one of many racing instances hold a key", async () => {
    const answers = await Promise.all(
      Array.from({ length: 16 }, () => store().claim("k2", "fp", DAY)),
    );
    expect(answers.filter((answer) => answer === undefined)).toHaveLength(1);
    expect(answers.filter((answer) => answer !== undefined)).toHaveLength(15);
  });

  it("completes the held key whole and keeps the claim's lifetime", async () => {
    const holder = store();
    await holder.claim("k3", "fp", Duration.seconds(30));
    await holder.complete("k3", { orderId: "ord_1" });
    expect(await stored("k3")).toEqual({
      fingerprint: "fp",
      done: true,
      output: { orderId: "ord_1" },
    });
    const lifetime = await valkey.client.pttl("it:idempotency:k3");
    expect(lifetime).toBeGreaterThan(0);
    expect(lifetime).toBeLessThanOrEqual(30_000);
    await expect(store().claim("k3", "fp", DAY)).resolves.toEqual({
      fingerprint: "fp",
      done: true,
      output: { orderId: "ord_1" },
    });
  });

  it("stores an absent output as null", async () => {
    const holder = store();
    await holder.claim("k4", "fp", DAY);
    await holder.complete("k4", undefined);
    expect(await stored("k4")).toEqual({ fingerprint: "fp", done: true, output: null });
  });

  it("never revives a key that lapsed before complete", async () => {
    const holder = store();
    await holder.claim("k5", "fp", Duration.parse("50ms"));
    await sleep(150);
    await holder.complete("k5", { late: true });
    expect(await valkey.client.exists("it:idempotency:k5")).toBe(0);
  });

  it("writes nothing on complete for a key this instance does not hold", async () => {
    await store().claim("k6", "fp", DAY);
    await store().complete("k6", { stolen: true });
    expect(await stored("k6")).toEqual({ fingerprint: "fp", done: false });
  });

  it("writes a refusal with a fresh lifetime, claimed or not, and a later claim reads it", async () => {
    const refusal = {
      kind: ErrorKind.Conflict,
      code: "out_of_stock",
      category: "conflict",
      retryable: false,
    } as const;
    const holder = store();
    await holder.claim("k7", "fp", Duration.seconds(1));
    await holder.completeRefused("k7", "fp", refusal, DAY);
    await store().completeRefused("k8", "fp", refusal, DAY);
    for (const key of ["k7", "k8"]) {
      // oxlint-disable-next-line no-await-in-loop -- two keys checked in turn
      expect(await valkey.client.pttl(`it:idempotency:${key}`)).toBeGreaterThan(86_000_000);
      // oxlint-disable-next-line no-await-in-loop -- two keys checked in turn
      await expect(store().claim(key, "fp", DAY)).resolves.toEqual({
        fingerprint: "fp",
        done: true,
        refusal,
      });
    }
  });

  it("frees a released key, and a lapsed one, for the next claim", async () => {
    const holder = store();
    await holder.claim("k9", "fp", DAY);
    await holder.release("k9");
    expect(await valkey.client.exists("it:idempotency:k9")).toBe(0);
    await expect(store().claim("k9", "fp-2", DAY)).resolves.toBeUndefined();
    await store().claim("k10", "fp", Duration.parse("50ms"));
    await sleep(150);
    await expect(store().claim("k10", "fp-2", DAY)).resolves.toBeUndefined();
    expect(await stored("k10")).toEqual({ fingerprint: "fp-2", done: false });
  });
});
