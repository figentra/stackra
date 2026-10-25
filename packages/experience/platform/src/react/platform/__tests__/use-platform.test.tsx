/**
 * Stackra file contract:
 * Purpose: unit tests of `usePlatform()`: it returns the container's `Platform`, and throws outside a
 *          `ContainerProvider` or when no driver is bound.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250.
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { Platform } from "#contracts/ports/platform.port";
import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
import { usePlatform } from "#react/platform/use-platform";

/** Renders whether the platform offers the network. */
function Probe() {
  return <span>{String(usePlatform().has("network"))}</span>;
}

describe("usePlatform", () => {
  it("returns the nearest container's Platform", async () => {
    const container = await Container.create([], {
      overrides: new Map([[Platform, new MemoryPlatformDriver()]]),
    });
    expect(
      renderToString(
        <ContainerProvider container={container}>
          <Probe />
        </ContainerProvider>,
      ),
    ).toBe("<span>true</span>");
    expectTypeOf(usePlatform).returns.toEqualTypeOf<Platform>();
  });

  it("throws outside a ContainerProvider and without a driver", async () => {
    expect(() => renderToString(<Probe />)).toThrow(/ContainerProvider/);
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Probe />
        </ContainerProvider>,
      ),
    ).toThrow();
  });
});
