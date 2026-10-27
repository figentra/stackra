/**
 * Stackra file contract:
 * Purpose: proves the web WorkflowCanvas draws one node per step in flow columns and one arrow per edge with its
 *          branch condition, reads each node's status and where it leads in words, selects on press, and moves focus
 *          along the arrows and within a column with the arrow keys.
 * Boundary: jsdom; the canvas is the package's own markup, so no HeroUI Pro stand-in is needed.
 * Runtime: browser
 * Governing contract: OS-230 (graph canvas); WCAG 2.2 SC 1.4.1 and 2.1.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { WorkflowCanvas } from "#react/workflow-canvas/workflow-canvas";

const nodes = [
  { id: "trigger", title: "Order placed" },
  { id: "confirm", title: "Confirm by SMS", status: "done" as const },
  { id: "ship", title: "Create shipment", status: "running" as const },
  { id: "cancel", title: "Cancel order", status: "skipped" as const },
];
const edges = [
  { from: "trigger", to: "confirm" },
  { from: "confirm", to: "ship", label: "if confirmed" },
  { from: "confirm", to: "cancel", label: "if refused" },
  { from: "confirm", to: "ghost" },
];

const node = (container: HTMLElement, id: string): HTMLButtonElement => {
  const found = container.querySelector<HTMLButtonElement>(`[data-node="${id}"]`);
  if (found === null) throw new Error(`no node ${id}`);
  return found;
};

describe("WorkflowCanvas (web)", () => {
  it("draws the nodes in flow columns and the known edges with their conditions", () => {
    const { container } = render(
      <WorkflowCanvas label="COD confirmation" nodes={nodes} edges={edges} />,
    );
    expect(screen.getByRole("group", { name: "COD confirmation" })).toBeTruthy();
    expect(node(container, "trigger").style.left).toBe("0px");
    expect(node(container, "ship").style.left).toBe(node(container, "cancel").style.left);
    expect(node(container, "ship").style.top).not.toBe(node(container, "cancel").style.top);
    expect(
      [...container.querySelectorAll("[data-edge]")].map((edge) => edge.getAttribute("data-edge")),
    ).toEqual(["trigger->confirm", "confirm->ship", "confirm->cancel"]);
    expect(container.querySelector('[data-edge="confirm->ship"]')?.textContent).toBe(
      "if confirmed",
    );
  });

  it("reads the status and where a node leads in words", () => {
    const { container } = render(<WorkflowCanvas label="Flow" nodes={nodes} edges={edges} />);
    const confirm = node(container, "confirm");
    expect(confirm.dataset["status"]).toBe("done");
    expect(confirm.textContent).toContain("(Done)");
    expect(confirm.textContent).toContain(
      "Leads to Create shipment (if confirmed), Cancel order (if refused)",
    );
    expect(node(container, "ship").textContent).not.toContain("Leads to");
  });

  it("selects a node on press and marks the selected one", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <WorkflowCanvas
        label="Flow"
        nodes={nodes}
        edges={edges}
        selectedId="ship"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(node(container, "cancel"));
    expect(onSelect).toHaveBeenCalledWith("cancel");
    expect(node(container, "ship").getAttribute("aria-pressed")).toBe("true");
    expect(node(container, "ship").tabIndex).toBe(0);
    expect(node(container, "trigger").tabIndex).toBe(-1);
  });

  it("moves focus along the arrows and within a column", () => {
    const { container } = render(<WorkflowCanvas label="Flow" nodes={nodes} edges={edges} />);
    node(container, "trigger").focus();
    fireEvent.keyDown(node(container, "trigger"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(node(container, "confirm"));
    fireEvent.keyDown(node(container, "confirm"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(node(container, "ship"));
    fireEvent.keyDown(node(container, "ship"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(node(container, "cancel"));
    fireEvent.keyDown(node(container, "cancel"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(node(container, "confirm"));
    expect(node(container, "confirm").tabIndex).toBe(0);
  });
});
