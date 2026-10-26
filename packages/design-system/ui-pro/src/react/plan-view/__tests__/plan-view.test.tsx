/**
 * Stackra file contract:
 * Purpose: proves the web PlanView draws one timeline item per step in order, tinted by its status and with the
 *          status read out in words, under a list named by the label, with the plan's actions after it.
 * Boundary: jsdom with real HeroUI Pro.
 * Runtime: browser
 * Governing contract: ADR 0245 (decision 8); WCAG 2.2 SC 1.4.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { PlanView } from "#react/plan-view/plan-view";

const statusLabels = {
  pending: "Waiting",
  running: "Running",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
};

describe("PlanView (web)", () => {
  it("draws the steps in order with their status", () => {
    const { container } = render(
      <PlanView
        label="Plan to restock"
        statusLabels={statusLabels}
        steps={[
          { id: "1", title: "Find low items", status: "done" },
          { id: "2", title: "Draft purchase orders", status: "running", detail: "3 suppliers" },
          { id: "3", title: "Email suppliers", status: "pending" },
        ]}
        actions={<button type="button">Approve plan</button>}
      />,
    );
    expect(screen.getByRole("list", { name: "Plan to restock" })).toBeTruthy();
    const items = container.querySelectorAll<HTMLElement>("[data-step-status]");
    expect([...items].map((item) => item.dataset["stepStatus"])).toEqual([
      "done",
      "running",
      "pending",
    ]);
    expect(items[0]?.dataset["status"]).toBe("success");
    expect(items[1]?.textContent).toContain("(Running)");
    expect(screen.getByText("3 suppliers")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Approve plan" })).toBeTruthy();
  });

  it("reads the status from the ui_pro catalogue when no words are given", () => {
    const { container } = render(
      <PlanView label="Plan" steps={[{ id: "1", title: "Find low items", status: "failed" }]} />,
    );
    expect(container.querySelector("[data-step-status]")?.textContent).toContain("(Failed)");
  });
});
