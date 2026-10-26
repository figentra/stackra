/**
 * Stackra file contract:
 * Purpose: proves the native PlanView draws one timeline item per step in order, tinted by its status, with the status
 *          written as a word (given or from the catalogue) and read with a text title, under a list named by the
 *          label, with the plan's actions after it.
 * Boundary: React Native does not render in vitest: react-native and this package's native Timeline are replaced by
 *           stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0245 (decision 8); WCAG 2.2 SC 1.4.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { PlanView } from "#native/plan-view/plan-view";

vi.mock("react-native", () => ({
  View: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
vi.mock("#native/timeline/timeline", async () => {
  const { createElement } = await import("react");
  const part = ({ children }: { children?: ReactNode }) => createElement("div", null, children);
  return {
    Timeline: Object.assign(
      (props: { children?: ReactNode; accessibilityLabel?: string }) =>
        createElement("ol", { "aria-label": props.accessibilityLabel }, props.children),
      {
        Item: (props: Record<string, unknown>) =>
          createElement(
            "li",
            {
              "data-testid": props["testID"],
              "data-status": props["status"],
              "aria-label": props["accessibilityLabel"],
            },
            props["children"] as ReactNode,
          ),
        Rail: part,
        Marker: part,
        Connector: part,
        Content: part,
        Title: part,
        Description: part,
      },
    ),
  };
});

const STEPS = [
  { id: "1", title: "Find low items", status: "done" },
  { id: "2", title: "Draft purchase orders", status: "running", detail: "3 suppliers" },
] as const;

describe("PlanView (native)", () => {
  it("draws the steps in order with their tone and status word", () => {
    render(
      <PlanView
        label="Plan to restock"
        steps={STEPS}
        statusLabels={{
          pending: "Waiting",
          running: "Working",
          done: "Finished",
          failed: "Failed",
          skipped: "Skipped",
        }}
        actions={<button type="button">Approve plan</button>}
      />,
    );
    expect(screen.getByRole("list", { name: "Plan to restock" })).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.dataset["status"])).toEqual(["success", "current"]);
    expect(items[1]?.getAttribute("aria-label")).toBe("Draft purchase orders, Working");
    expect(screen.getByText("3 suppliers")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Approve plan" })).toBeTruthy();
  });

  it("reads the status from the ui_pro catalogue when no words are given", () => {
    render(<PlanView label="Plan" steps={[{ id: "1", title: "Email", status: "failed" }]} />);
    expect(screen.getByText("Failed")).toBeTruthy();
  });
});
