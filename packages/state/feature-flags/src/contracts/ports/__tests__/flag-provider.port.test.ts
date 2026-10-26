/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `FlagProvider` port: a port a driver implements, keyed so that
 *          `DriverName<FlagProvider>` is exactly this package's driver names (`config`, `posthog`).
 * Boundary: test only; the registry entry comes from this package's own augmentation, loaded through the core types.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import type { DriverName } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FlagProvider } from "#contracts/ports/flag-provider.port";
import type { FlagContext } from "#contracts/types/flag-context.type";
import type { FlagProviderName } from "#core/types/flag-provider-name.type";

describe("FlagProvider", () => {
  it("is a port a provider implements", async () => {
    const seen: FlagContext[] = [];
    class StaticProvider extends FlagProvider {
      values(context: FlagContext): Promise<Readonly<Record<string, boolean>>> {
        seen.push(context);
        return Promise.resolve({ "web.help_centre": true });
      }
    }
    const provider = new StaticProvider();
    const context: FlagContext = { subject: "usr_1", tenant: "ten_1" };
    await expect(provider.values(context)).resolves.toEqual({ "web.help_centre": true });
    expect(provider).toBeInstanceOf(FlagProvider);
    expect(provider).toBeInstanceOf(Port);
    expect(seen).toEqual([context]);
  });

  it("narrows DriverName to this port's drivers", () => {
    expectTypeOf<DriverName<FlagProvider>>().toEqualTypeOf<FlagProviderName>();
    expectTypeOf<FlagProviderName>().toEqualTypeOf<"config" | "memory" | "posthog">();
    const name: DriverName<FlagProvider> = "posthog";
    // @ts-expect-error -- not a driver of this port
    const other: DriverName<FlagProvider> = "redis";
    expect([name, other]).toEqual(["posthog", "redis"]);
  });
});
