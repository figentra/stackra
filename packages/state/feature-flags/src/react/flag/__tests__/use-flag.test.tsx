/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useFlag(ref)`: it renders the declared default before any load and the provider's
 *          value after one, reads the `FlagReader` the nearest container binds (a fake bound in its place too), and
 *          throws outside a provider or when nothing binds the reader.
 * Boundary: test only; renders with react-dom/server (no DOM needed).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 3); ADR 0295 (decision 10).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import { ConfigFlagProviderDriver } from "#core/drivers/config-flag-provider.driver";
import { Flag, FlagReader, flagRefs } from "#core/index";
import { useFlag } from "#react/flag/use-flag";
import { fakeFlags } from "#testing/functions/fake-flags.function";

class PricingYearlyFirstFlag extends Flag({ default: false, expires: "2027-03-31" }) {}

const Flags = flagRefs({ web: { pricing_yearly_first: PricingYearlyFirstFlag } });

/** Renders which interval the pricing toggle opens on. */
function OpensOn() {
  return <span>{useFlag(Flags.web.pricing_yearly_first) ? "year" : "month"}</span>;
}

/** Renders `<OpensOn />` in a container that binds `reader` as the `FlagReader`. */
async function renderWith(reader: FlagReader): Promise<string> {
  const container = await Container.create([], { overrides: new Map([[FlagReader, reader]]) });
  return renderToString(
    <ContainerProvider container={container}>
      <OpensOn />
    </ContainerProvider>,
  );
}

describe("useFlag", () => {
  it("renders the default before a load and the provider's value after one", async () => {
    const config = buildConfig(FeatureFlagsConfig, {
      values: { values: { "web.pricing_yearly_first": true } },
    });
    const reader = new FlagReader(config, new ConfigFlagProviderDriver(config));
    expect(await renderWith(reader)).toBe("<span>month</span>");
    await reader.load({ visitor: "vis_1", user: null, scope: null });
    expect(await renderWith(reader)).toBe("<span>year</span>");
    expectTypeOf(useFlag).returns.toEqualTypeOf<boolean>();
  });

  it("reads a fake bound in place of the reader", async () => {
    const flags = fakeFlags((fake) => fake.set(Flags.web.pricing_yearly_first, true));
    expect(await renderWith(flags)).toBe("<span>year</span>");
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<OpensOn />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind FlagReader", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <OpensOn />
        </ContainerProvider>,
      ),
    ).toThrow(/FlagReader/);
  });
});
