/**
 * Stackra file contract:
 * Purpose: proves the native DiffReview: it counts the pending changes in a polite live region, names each change's
 *          before and after (or "not set") as one element, accepts or rejects one change, accepts every pending
 *          change at once keeping the decided ones, dims a rejected change, and applies only once nothing is pending.
 * Boundary: React Native does not render in vitest, so it and the house Button, Icon and Text are stand-ins that render
 *           plain DOM; what the review reports through its callbacks is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DiffChange } from "#contracts/types/diff-change.type";
import type { DiffDecision } from "#contracts/types/diff-decision.type";
import { DiffReview } from "#native/diff-review/diff-review";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        {
          "aria-label": props["accessibilityLabel"] as string,
          className: props["className"] as string,
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { "aria-live": props["accessibilityLiveRegion"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          disabled: props["isDisabled"],
          "data-variant": props["variant"],
          onClick: props["onPress"],
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const K = "ui::diff_review.";
const CHANGES: readonly DiffChange[] = [
  { id: "a", label: "Name", before: "Ada", after: "Ada L." },
  { id: "b", label: "Phone", before: null, after: "123" },
  { id: "c", label: "Fax", before: "9", after: null },
];

const setup = (decisions: DiffDecision = {}, onApply?: (decisions: DiffDecision) => void) => {
  const onDecisionsChange = vi.fn();
  render(
    <DiffReview
      changes={CHANGES}
      decisions={decisions}
      onDecisionsChange={onDecisionsChange}
      onApply={onApply}
      label="Changes"
      className="wide"
    />,
  );
  return onDecisionsChange;
};

describe("DiffReview (native)", () => {
  it("counts the pending changes and names each before and after", () => {
    setup();
    expect(screen.getByText(`${K}pending {"count":3}`).getAttribute("aria-live")).toBe("polite");
    expect(screen.getByLabelText(`${K}before Ada، ${K}after Ada L.`)).toBeTruthy();
    expect(screen.getByLabelText(`${K}before ${K}not_set، ${K}after 123`)).toBeTruthy();
    expect(screen.getByLabelText(`${K}before 9، ${K}after ${K}not_set`)).toBeTruthy();
    expect(screen.queryByText(`${K}apply`)).toBeNull();
  });

  it("accepts and rejects one change", () => {
    const onDecisionsChange = setup({ c: "rejected" });
    fireEvent.click(screen.getAllByText(`${K}accept`)[0] as HTMLElement);
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ c: "rejected", a: "accepted" });
    fireEvent.click(screen.getAllByText(`${K}reject`)[0] as HTMLElement);
    expect(onDecisionsChange).toHaveBeenLastCalledWith({ c: "rejected", a: "rejected" });
  });

  it("accepts every pending change, keeping the decided ones", () => {
    const onDecisionsChange = setup({ c: "rejected" });
    fireEvent.click(screen.getByText(`${K}accept_all`));
    expect(onDecisionsChange).toHaveBeenCalledWith({ a: "accepted", b: "accepted", c: "rejected" });
  });

  it("marks the decisions, dims a rejection and applies once nothing is pending", () => {
    const onApply = vi.fn();
    const decisions: DiffDecision = { a: "accepted", b: "accepted", c: "rejected" };
    setup(decisions, onApply);
    expect(screen.getAllByText(`${K}accepted`)[0]?.dataset["variant"]).toBe("primary");
    expect(screen.getByText(`${K}rejected`).dataset["variant"]).toBe("danger");
    expect(screen.getByText(`${K}accept_all`)).toHaveProperty("disabled", true);
    expect(screen.getByText("Fax").parentElement?.className.includes("opacity-60")).toBe(true);
    fireEvent.click(screen.getByText(`${K}apply`));
    expect(onApply).toHaveBeenCalledWith(decisions);
  });

  it("holds apply while a change is pending", () => {
    setup({ a: "accepted" }, vi.fn());
    expect(screen.getByText(`${K}apply`)).toHaveProperty("disabled", true);
  });
});
