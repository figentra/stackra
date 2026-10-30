/**
 * Stackra file contract:
 * Purpose: proves the native TaskTray: nothing while empty; a header that counts running and failed tasks in a polite
 *          live region; cancel, retry and remove named after the task and only where its state allows; a bar while it
 *          runs; and a fold button that reports `expanded` and hides the rows.
 * Boundary: React Native and the house children do not run in vitest, so they are replaced by recording stand-ins that
 *           render plain DOM; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { TaskTrayTask } from "#contracts/types/task-tray-task.type";
import { TaskTray } from "#native/task-tray/task-tray";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"], "data-class": props["className"] },
        props["children"] as never,
      ),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { "aria-live": props["accessibilityLiveRegion"] },
        props["children"] as never,
      ),
  };
});

vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => null }));

vi.mock("#native/progress-bar/progress-bar", async () => {
  const { createElement } = await import("react");
  return {
    ProgressBar: (props: Record<string, unknown>) =>
      createElement("progress", { "aria-label": props["label"], value: props["value"] }),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as never },
        props["children"] as never,
      ),
  };
});

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"],
        "aria-expanded": (props["accessibilityState"] as { expanded?: boolean } | undefined)
          ?.expanded,
        onClick: props["onPress"] as never,
      }),
  };
});

const TASKS: readonly TaskTrayTask[] = [
  { id: "export", label: "orders.csv", status: "running", progress: 40 },
  { id: "import", label: "customers.xlsx", status: "error" },
  { id: "upload", label: "logo.png", status: "done" },
];

describe("TaskTray (native)", () => {
  it("draws nothing without tasks", () => {
    const { container } = render(<TaskTray tasks={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("counts the tasks and gives each the buttons its state allows", () => {
    const calls: string[] = [];
    render(
      <TaskTray
        tasks={TASKS}
        onCancel={(id) => calls.push(`cancel:${id}`)}
        onRetry={(id) => calls.push(`retry:${id}`)}
        onDismiss={(id) => calls.push(`dismiss:${id}`)}
      />,
    );
    expect(document.querySelector("[aria-live=polite]")?.textContent).toBe(
      "1 task in progress · 1 failed",
    );
    expect(screen.getByLabelText("Background tasks")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "orders.csv" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel orders.csv" }));
    fireEvent.click(screen.getByRole("button", { name: "Try customers.xlsx again" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove logo.png" }));
    expect(calls).toEqual(["cancel:export", "retry:import", "dismiss:upload"]);
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("folds the rows away and reports it", () => {
    render(<TaskTray tasks={TASKS} />);
    const fold = screen.getByRole("button", { name: "Hide tasks" });
    expect(fold.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(fold);
    expect(screen.getByRole("button", { name: "Show tasks" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(screen.queryByText("orders.csv")).toBeNull();
  });
});
