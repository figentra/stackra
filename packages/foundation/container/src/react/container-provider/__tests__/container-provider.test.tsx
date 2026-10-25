/**
 * Stackra file contract:
 * Purpose: unit tests of `ContainerProvider`: it renders its children and makes its container the one
 *          `useContainer()` reads below it, the nearest provider winning, on a server render.
 * Boundary: test only; renders with react-dom/server, so no DOM environment is needed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 23).
 */
import { renderToString } from "react-dom/server";

import { describe, expect, it } from "@stackra/testing";

import { Service } from "#core/bases/service.base";
import { Container } from "#core/index";
import { ContainerProvider } from "#react/container-provider/container-provider";
import { useContainer } from "#react/container-provider/use-container";

class Greeter extends Service {
  readonly greeting: string = "hello";
}

/** Prints the greeting of the container above it. */
function Probe() {
  return <span>{useContainer().get(Greeter).greeting}</span>;
}

const boot = (greeting: string) =>
  Container.create([], {
    overrides: new Map([[Greeter, Object.assign(new Greeter(), { greeting })]]),
  });

describe("ContainerProvider", () => {
  it("renders its children under its container", async () => {
    const container = await boot("hello");
    const html = renderToString(
      <ContainerProvider container={container}>
        <Probe />
      </ContainerProvider>,
    );
    expect(html).toBe("<span>hello</span>");
  });

  it("lets the nearest provider win", async () => {
    const outer = await boot("outer");
    const inner = await boot("inner");
    const html = renderToString(
      <ContainerProvider container={outer}>
        <Probe />
        <ContainerProvider container={inner}>
          <Probe />
        </ContainerProvider>
      </ContainerProvider>,
    );
    expect(html).toBe("<span>outer</span><span>inner</span>");
  });
});
