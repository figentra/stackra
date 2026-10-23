/**
 * Stackra file contract:
 * Purpose: proves the native FieldError hands HeroUI Native its message and `isInvalid` when given (false included),
 *          leaves `isInvalid` out entirely when not (so a HeroUI Native field's own state decides), and passes the
 *          class and test id through.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by a recording stand-in that renders
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-092
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { FieldErrorContractProps } from "#contracts/types/field-error-contract-props.type";
import { FieldError, type FieldErrorProps } from "#native/field-error/field-error";

/** The props the stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    FieldError: (props: Record<string, unknown>) => {
      received.props = props;
      return createElement("div", { "data-testid": "error" }, props["children"] as ReactNode);
    },
  };
});

describe("FieldError (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native its message", () => {
    render(<FieldError isInvalid>Enter an email address.</FieldError>);
    expect(screen.getByTestId("error").textContent).toBe("Enter an email address.");
  });

  it("hands over isInvalid when given, false included", () => {
    const { rerender } = render(<FieldError isInvalid>Message</FieldError>);
    expect(received.props).toMatchObject({ isInvalid: true });
    rerender(<FieldError isInvalid={false}>Message</FieldError>);
    expect(received.props).toMatchObject({ isInvalid: false });
  });

  it("leaves isInvalid out entirely when the caller does not give it", () => {
    render(<FieldError>Message</FieldError>);
    expect(received.props).not.toHaveProperty("isInvalid");
  });

  it("passes the class and test id through", () => {
    render(
      <FieldError className="mine" testID="e">
        Message
      </FieldError>,
    );
    expect(received.props).toMatchObject({ className: "mine", testID: "e" });
  });

  it("types: extends the contract", () => {
    expectTypeOf<FieldErrorProps>().toExtend<FieldErrorContractProps>();
  });
});
