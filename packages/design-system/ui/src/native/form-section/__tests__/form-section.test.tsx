/**
 * Stackra file contract:
 * Purpose: proves the native FormSection is a View with the group role named by a string title, draws the title as a
 *          level-3 Heading in the h5 style and the description as a Description, draws no description when it has none,
 *          keeps its fields after the title, merges its gaps with the caller's class, and passes View props through.
 * Boundary: React Native does not render in vitest, so react-native, the Heading and the Description are replaced by
 *           recording stand-ins that render plain DOM; what reaches them is checked, not how they draw.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-060 sta-350:FR-061
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { FormSectionContractProps } from "#contracts/types/form-section-contract-props.type";
import { FormSection, type FormSectionProps } from "#native/form-section/form-section";

/** The props the stand-ins were last handed, by name. */
const received = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  heading: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.views.push(props);
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/heading/heading", async () => {
  const { createElement } = await import("react");
  return {
    Heading: (props: Record<string, unknown>) => {
      received.heading = props;
      return createElement("h3", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/description/description", async () => {
  const { createElement } = await import("react");
  return {
    Description: (props: Record<string, unknown>) =>
      createElement("p", null, props["children"] as ReactNode),
  };
});

describe("FormSection (native)", () => {
  beforeEach(() => {
    received.views = [];
    received.heading = {};
  });

  it("is a group named by a string title", () => {
    render(<FormSection title="Billing" />);
    expect(received.views[0]).toMatchObject({ role: "group", accessibilityLabel: "Billing" });
  });

  it("names no label for a title that is not a string", () => {
    render(<FormSection title={<span>Billing</span>} />);
    expect(received.views[0]).not.toHaveProperty("accessibilityLabel");
  });

  it("draws the title as a level-3 heading in the h5 style", () => {
    render(<FormSection title="Billing" />);
    expect(received.heading).toMatchObject({ level: 3, type: "h5", children: "Billing" });
  });

  it("draws the description under the title, and none when it has none", () => {
    const { rerender } = render(<FormSection title="Billing" />);
    expect(screen.queryByText("Where invoices go")).toBeNull();
    rerender(<FormSection title="Billing" description="Where invoices go" />);
    expect(screen.getByText("Where invoices go")).toBeTruthy();
  });

  it("keeps its fields after the title", () => {
    render(
      <FormSection title="Billing">
        <span>Field</span>
      </FormSection>,
    );
    const root = screen.getAllByTestId("view")[0];
    expect(root?.lastElementChild?.textContent).toBe("Field");
  });

  it("merges its gap with the caller's class and passes View props through", () => {
    render(<FormSection title="Billing" className="mt-4" testID="billing" />);
    expect(received.views[0]).toMatchObject({ className: "gap-4 mt-4", testID: "billing" });
  });

  it("types: extends the contract, which needs a title, and refuses the web's disabled", () => {
    expectTypeOf<FormSectionProps>().toExtend<FormSectionContractProps>();
    // @ts-expect-error a section without a title names nothing
    render(<FormSection />);
    // @ts-expect-error `disabled` is a web fieldset prop: a native field takes its own `isDisabled`
    render(<FormSection title="Billing" disabled />);
  });
});
