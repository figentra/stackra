/**
 * Stackra file contract:
 * Purpose: proves the web TaskTray: nothing while empty; a named region whose header counts the running and failed
 *          tasks in a polite live region; cancel, retry and remove only where the state allows and with the task's
 *          name; a bar while running; "Clear finished" once a task has finished; and a fold button that hides the
 *          list and reports it with aria-expanded.
 * Boundary: jsdom with real HeroUI and React Aria; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { TaskTrayTask } from "#contracts/types/task-tray-task.type";
import { TaskTray } from "#react/task-tray/task-tray";

const TASKS: readonly TaskTrayTask[] = [
  { id: "export", label: "orders.csv", status: "running", progress: 40, icon: "download" },
  { id: "import", label: "customers.xlsx", status: "error", detail: "Row 12 has no phone" },
  { id: "upload", label: "logo.png", status: "done" },
];

describe("TaskTray (web)", () => {
  it("draws nothing without tasks", () => {
    const { container } = render(<TaskTray tasks={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("counts the tasks and gives each the buttons its state allows", () => {
    const calls: string[] = [];
    render(
      <TaskTray
        tasks={TASKS}
        placement="inline"
        onCancel={(id) => calls.push(`cancel:${id}`)}
        onRetry={(id) => calls.push(`retry:${id}`)}
        onDismiss={(id) => calls.push(`dismiss:${id}`)}
        onClear={() => calls.push("clear")}
      />,
    );
    const region = screen.getByRole("region", { name: "Background tasks" });
    expect(region.querySelector("[aria-live=polite]")?.textContent).toBe(
      "1 task in progress · 1 failed",
    );
    expect(screen.getByRole("progressbar", { name: "orders.csv" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel orders.csv" }));
    fireEvent.click(screen.getByRole("button", { name: "Try customers.xlsx again" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove logo.png" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear finished" }));
    expect(calls).toEqual(["cancel:export", "retry:import", "dismiss:upload", "clear"]);
    expect(screen.queryByRole("button", { name: "Cancel logo.png" })).toBeNull();
    expect(screen.getByText("Row 12 has no phone")).toBeTruthy();
  });

  it("folds the list away and says so", () => {
    render(<TaskTray tasks={TASKS} />);
    const fold = screen.getByRole("button", { name: "Hide tasks" });
    expect(fold.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(fold);
    const show = screen.getByRole("button", { name: "Show tasks" });
    expect(show.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(show.getAttribute("aria-controls") ?? "")?.hidden).toBe(true);
  });
});
