/**
 * Stackra file contract:
 * Purpose: proves the native Form is a plain View around its children that passes every View prop through, and that
 *          it takes no web-only form prop.
 * Boundary: React Native does not render in vitest, so react-native is replaced by a recording stand-in that renders
 *          plain DOM; what reaches the View is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-093
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { FormContractProps } from "#contracts/types/form-contract-props.type";
import { Form, type FormProps } from "#native/form/form";

/** The props the stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.props = props;
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});

describe("Form (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("is a View around its children", () => {
    render(
      <Form>
        <span>Field</span>
      </Form>,
    );
    expect(screen.getByTestId("view").textContent).toBe("Field");
  });

  it("passes the class, style and accessibility props through", () => {
    render(
      <Form className="gap-4" style={{ padding: 4 }} accessibilityLabel="Profile" testID="form" />,
    );
    expect(received.props).toMatchObject({
      className: "gap-4",
      style: { padding: 4 },
      accessibilityLabel: "Profile",
      testID: "form",
    });
  });

  it("types: extends the contract and refuses the web's submit key handling", () => {
    expectTypeOf<FormProps>().toExtend<FormContractProps>();
    // @ts-expect-error `isSubmitOnModEnter` is a web prop: a screen submits by its button
    render(<Form isSubmitOnModEnter />);
  });
});
