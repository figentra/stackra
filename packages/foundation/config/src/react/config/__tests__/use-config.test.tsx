/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useConfig(Class)`: it returns the instance the container of the nearest
 *          `ContainerProvider` binds for the class (a host override's instance through the base class too), typed as
 *          the class, and throws outside a provider or for a class the container does not bind.
 * Boundary: test only; renders with react-dom/server (no DOM needed).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 17 and
 *                     19); ADR 0295 (decision 10).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { renderToString } from "react-dom/server";
import { z } from "zod";

import { buildConfig, Config } from "#core/index";
import { useConfig } from "#react/config/use-config";

class SiteOptions extends Schema {
  signupPath = "/signup";
}

registerSchemas([[SiteOptions, z.object({ signupPath: z.string() })]]);

class SiteConfig extends Config({ schema: SiteOptions }) {}

class HostSiteConfig extends SiteConfig {
  override signupPath = "/join";
}

class OtherConfig extends Config({ schema: SiteOptions }) {}

/** Renders the signup path of the bound site config. */
function SignupPath() {
  return <span>{useConfig(SiteConfig).signupPath}</span>;
}

/** Renders the path of a config nothing binds. */
function Unbound() {
  return <span>{useConfig(OtherConfig).signupPath}</span>;
}

describe("useConfig", () => {
  it("returns the instance the container binds for the class", async () => {
    const container = await Container.create(
      [
        {
          member: "web",
          config: [{ key: "web.site", provide: SiteConfig, override: HostSiteConfig }],
        },
      ],
      { overrides: new Map([[SiteConfig, buildConfig(HostSiteConfig)]]) },
    );
    const html = renderToString(
      <ContainerProvider container={container}>
        <SignupPath />
      </ContainerProvider>,
    );
    expect(html).toBe("<span>/join</span>");
    expectTypeOf(useConfig<SiteConfig>).returns.toEqualTypeOf<SiteConfig>();
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<SignupPath />)).toThrow(/ContainerProvider/);
  });

  it("throws for a class the container does not bind", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Unbound />
        </ContainerProvider>,
      ),
    ).toThrow(/OtherConfig/);
  });
});
