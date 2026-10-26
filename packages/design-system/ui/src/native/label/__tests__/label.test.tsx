/**
 * Stackra file contract:
 * Purpose: proves the native Label hands HeroUI Native its text and the required, invalid and disabled states when
 *          given, leaves a state out entirely (so a HeroUI Native field's own state shows) when not, and passes the
 *          class and test id through.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by a recording stand-in that renders
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-090
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { LabelContractProps } from "#contracts/types/label-contract-props.type";
import { Label } from "#native/label/label";
import type { LabelProps } from "#native/label/label.props";

/** The props the stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    Label: (props: Record<string, unknown>) => {
      received.props = props;
      return createElement("div", { "data-testid": "label" }, props["children"] as ReactNode);
    },
  };
});

describe("Label (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native its text", () => {
    render(<Label>Email</Label>);
    expect(screen.getByTestId("label").textContent).toBe("Email");
  });

  it("leaves a state out entirely when the caller does not give it", () => {
    render(<Label isInvalid={undefined}>Email</Label>);
    for (const state of ["isRequired", "isInvalid", "isDisabled"])
      expect(received.props).not.toHaveProperty(state);
  });

  it("hands over each state when given, false included", () => {
    render(
      <Label isRequired isInvalid={false} isDisabled>
        Email
      </Label>,
    );
    expect(received.props).toMatchObject({ isRequired: true, isInvalid: false, isDisabled: true });
  });

  it("passes the class and test id through", () => {
    render(
      <Label className="mine" testID="name">
        Email
      </Label>,
    );
    expect(received.props).toMatchObject({ className: "mine", testID: "name" });
  });

  it("types: extends the contract", () => {
    expectTypeOf<LabelProps>().toExtend<LabelContractProps>();
  });
});
