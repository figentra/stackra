/**
 * Stackra file contract:
 * Purpose: proves the ReactNavigationProvider hands `@stackra/ui`'s native `RouterProvider` React Navigation's
 *          `useLinkTo()` function as its `navigate`, and renders its children.
 * Boundary: React Native does not render in vitest, so React Navigation and the provider are recording stand-ins; the
 *           link that reads the context is `@stackra/ui`'s own test.
 * Runtime: node
 * Governing contract: ADR 0317 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-183
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ReactNavigationProvider } from "#native/react-navigation-provider/react-navigation-provider";

const linkTo = vi.hoisted(() => vi.fn());
const seen = vi.hoisted(() => ({ navigate: undefined as unknown }));

vi.mock("@react-navigation/native", () => ({ useLinkTo: () => linkTo }));

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return {
    RouterProvider: (props: { readonly navigate: unknown; readonly children?: ReactNode }) => {
      seen.navigate = props.navigate;
      return createElement("div", { "data-testid": "provider" }, props.children);
    },
  };
});

describe("ReactNavigationProvider", () => {
  it("gives the RouterProvider React Navigation's link-to function and renders its children", () => {
    render(
      <ReactNavigationProvider>
        <span>Inside</span>
      </ReactNavigationProvider>,
    );
    expect(seen.navigate).toBe(linkTo);
    expect(screen.getByTestId("provider").textContent).toBe("Inside");
  });
});
