/**
 * Stackra file contract:
 * Purpose: unit tests of `useContainer()`: it returns the container of the nearest provider and throws outside one,
 *          so a missing provider is never hidden by a default.
 * Boundary: test only; renders with react-dom/server, so no DOM environment is needed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 23).
 */
import { renderToString } from "react-dom/server";

import { describe, expect, it } from "@stackra/testing";

import { Container } from "#core/index";
import { ContainerProvider } from "#react/container-provider/container-provider";
import { useContainer } from "#react/container-provider/use-container";

/** Renders nothing but reads the container, so a missing provider throws. */
function Orphan() {
  useContainer();
  return null;
}

describe("useContainer", () => {
  it("returns the container of the nearest provider", async () => {
    const container = await Container.create([]);
    function Probe() {
      return useContainer() === container ? "same" : "other";
    }
    const html = renderToString(
      <ContainerProvider container={container}>
        <Probe />
      </ContainerProvider>,
    );
    expect(html).toBe("same");
  });

  it("throws outside a provider", () => {
    expect(() => renderToString(<Orphan />)).toThrow(/needs a ContainerProvider above it/);
  });
});
