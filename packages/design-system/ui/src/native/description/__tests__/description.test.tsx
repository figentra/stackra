/**
 * Stackra file contract:
 * Purpose: proves the native Description hands HeroUI Native its text and passes `nativeID` (the id a control names it
 *          by), `hideOnInvalid`, the class and the test id through unchanged.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by a recording stand-in that renders
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-091
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DescriptionContractProps } from "#contracts/types/description-contract-props.type";
import { Description, type DescriptionProps } from "#native/description/description";

/** The props the stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    Description: (props: Record<string, unknown>) => {
      received.props = props;
      return createElement("div", { "data-testid": "description" }, props["children"] as ReactNode);
    },
  };
});

describe("Description (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native its text", () => {
    render(<Description>Used only for receipts.</Description>);
    expect(screen.getByTestId("description").textContent).toBe("Used only for receipts.");
  });

  it("passes nativeID, hideOnInvalid, the class and the test id through", () => {
    render(
      <Description nativeID="hint" hideOnInvalid className="mine" testID="d">
        Hint
      </Description>,
    );
    expect(received.props).toMatchObject({
      nativeID: "hint",
      hideOnInvalid: true,
      className: "mine",
      testID: "d",
    });
  });

  it("types: extends the contract", () => {
    expectTypeOf<DescriptionProps>().toExtend<DescriptionContractProps>();
  });
});
