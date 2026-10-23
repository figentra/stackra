/**
 * Stackra file contract:
 * Purpose: proves the native IconRegistryProvider gives `useIcon` its registry, resolves an alias through the Lucide
 *          name it stands for, merges nested providers with the nearest winning, and leaves a name outside every
 *          registry without a component and without an error.
 * Boundary: the provider imports React only, so it runs in jsdom with real React and stand-in icon components; no
 *          React Native module is loaded.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-050
import { render } from "@testing-library/react";
import { createElement } from "react";

import type { IconComponent } from "#contracts/types/icon-component.type";
import type { IconName } from "#contracts/types/icon-name.type";
import { IconRegistryProvider, useIcon } from "#native/index";

const Cart: IconComponent = () => <svg data-testid="cart" />;
const Bag: IconComponent = () => <svg data-testid="bag" />;
const Badge: IconComponent = () => <svg data-testid="badge" />;

/** Draws what `useIcon` resolves for a name, or a marker when it resolves to nothing. */
function Probe({ name }: { readonly name: IconName }) {
  const Drawn = useIcon(name);
  return Drawn ? createElement(Drawn) : <i data-testid="missing" />;
}

describe("IconRegistryProvider (native)", () => {
  it("gives useIcon the components of its registry, custom names included", () => {
    const { getByTestId } = render(
      <IconRegistryProvider registry={{ "shopping-cart": Cart, "loyalty::points-badge": Badge }}>
        <Probe name="shopping-cart" />
        <Probe name="loyalty::points-badge" />
      </IconRegistryProvider>,
    );
    expect(getByTestId("cart")).toBeTruthy();
    expect(getByTestId("badge")).toBeTruthy();
  });

  it("resolves an alias through the Lucide name it stands for", () => {
    const { getByTestId } = render(
      <IconRegistryProvider registry={{ "shopping-cart": Cart }}>
        <Probe name="orders" />
      </IconRegistryProvider>,
    );
    expect(getByTestId("cart")).toBeTruthy();
  });

  it("resolves a name nothing holds to no component, outside a provider too", () => {
    const { getAllByTestId } = render(
      <>
        <Probe name="arrow-right" />
        <IconRegistryProvider registry={{ "shopping-cart": Cart }}>
          <Probe name="arrow-right" />
        </IconRegistryProvider>
      </>,
    );
    expect(getAllByTestId("missing")).toHaveLength(2);
  });

  it("merges nested providers, the nearest winning", () => {
    const { getByTestId, queryByTestId } = render(
      <IconRegistryProvider registry={{ "shopping-cart": Cart, "loyalty::points-badge": Badge }}>
        <IconRegistryProvider registry={{ "shopping-cart": Bag }}>
          <Probe name="shopping-cart" />
          <Probe name="loyalty::points-badge" />
        </IconRegistryProvider>
      </IconRegistryProvider>,
    );
    expect(getByTestId("bag")).toBeTruthy();
    expect(getByTestId("badge")).toBeTruthy();
    expect(queryByTestId("cart")).toBeNull();
  });
});
