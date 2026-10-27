/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryFlagProviderDriver`: it is the `FlagProvider` port, starts empty, answers the values
 *          set (the last call for a key winning) as a copy, and the same for every subject.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { FlagProvider } from "#contracts/ports/flag-provider.port";
import { MemoryFlagProviderDriver } from "#core/drivers/memory-flag-provider.driver";

describe(MemoryFlagProviderDriver, () => {
  it("answers the values set, as a copy, for any subject", async () => {
    const provider = new MemoryFlagProviderDriver();
    expect(provider).toBeInstanceOf(FlagProvider);
    await expect(provider.values({ subject: null, scope: null })).resolves.toEqual({});
    provider.set("web.help_centre", true).set("web.help_centre", false).set("web.beta", true);
    const values = await provider.values({ subject: "usr_1", scope: null });
    expect(values).toEqual({ "web.help_centre": false, "web.beta": true });
    provider.set("web.beta", false);
    expect(values["web.beta"]).toBe(true);
  });
});
