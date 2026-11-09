/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsRateLimitCapSourceDriver` and its `RateLimitSettings` group: it is a
 *          `RateLimitCapSource`, caps nothing by default, answers the area's caps a scope stores (its own over the
 *          platform's), and throws when a stored value breaks the group's schema, so the call fails closed.
 * Boundary: test only; the store is this package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0217 (decision 2); ADR 0213 (decision 2).
 */
import { ApiArea, RateLimitCapSource, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsRateLimitCapSourceDriver } from "#core/drivers/settings-rate-limit-cap-source.driver";
import { SettingsReader } from "#core/services/settings-reader.service";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** A driver over a memory store. */
function setup() {
  const store = new MemorySettingValueStoreDriver();
  return { store, source: new SettingsRateLimitCapSourceDriver(new SettingsReader(store)) };
}

describe(SettingsRateLimitCapSourceDriver, () => {
  it("is a RateLimitCapSource that caps nothing by default", async () => {
    const { source } = setup();
    expect(source).toBeInstanceOf(RateLimitCapSource);
    expect(await source.caps(ApiArea.App, ACME)).toEqual({
      perMinute: null,
      burst: null,
      actionPerScope: null,
      actionPerAddress: null,
    });
  });

  it("answers the area's caps the scope stores, over the platform's", async () => {
    const { store, source } = setup();
    await store.write("rate_limit", {}, { appPerMinute: 600, actionPerAddress: 50 });
    await store.write("rate_limit", { scope: ACME }, { appPerMinute: 30, appBurst: 10 });
    expect(await source.caps(ApiArea.App, ACME)).toEqual({
      perMinute: 30,
      burst: 10,
      actionPerScope: null,
      actionPerAddress: 50,
    });
    expect((await source.caps(ApiArea.Admin, ACME)).perMinute).toBeNull();
    expect((await source.caps(ApiArea.App, undefined)).perMinute).toBe(600);
  });

  it("throws when a stored cap breaks the schema", async () => {
    const { store, source } = setup();
    await store.write("rate_limit", { scope: ACME }, { appBurst: 0 });
    await expect(source.caps(ApiArea.App, ACME)).rejects.toThrow();
  });
});
