/**
 * Stackra file contract:
 * Purpose: proves the web SetupGuide is a region named by its title with a named progressbar, ticks a task through
 *          `onCompleteChange`, shows a task's action only while it is open, toggles its list with `aria-expanded`, and
 *          folds an uncontrolled list with the done line once every task is done.
 * Boundary: jsdom with real HeroUI and Motion; the fold and pop are not timed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { SetupGuideTask } from "#contracts/types/setup-guide-task.type";
import { SetupGuide } from "#react/setup-guide/setup-guide";

const WORDS = {
  title: "Set up your store",
  progressLabel: (done: number, total: number) => `${done} of ${total} done`,
  completeLabel: "All set",
  toggleLabel: (isExpanded: boolean) => (isExpanded ? "Hide tasks" : "Show tasks"),
};

const open = (onAction = vi.fn()): SetupGuideTask[] => [
  { id: "product", title: "Add a product", isComplete: true },
  { id: "payments", title: "Set up payments", isComplete: false, actionLabel: "Connect", onAction },
];

describe("SetupGuide (web)", () => {
  it("is a region named by its title with its progress and tasks", () => {
    const onAction = vi.fn();
    render(<SetupGuide {...WORDS} tasks={open(onAction)} />);
    expect(screen.getByRole("region", { name: "Set up your store" })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "1 of 2 done" })).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("reports a tick with the task's id", () => {
    const onCompleteChange = vi.fn();
    render(<SetupGuide {...WORDS} tasks={open()} onCompleteChange={onCompleteChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Set up payments" }));
    expect(onCompleteChange).toHaveBeenCalledWith("payments", true);
  });

  it("shows and hides the list from its toggle", async () => {
    const onExpandedChange = vi.fn();
    render(<SetupGuide {...WORDS} tasks={open()} onExpandedChange={onExpandedChange} />);
    const toggle = screen.getByRole("button", { name: "Hide tasks" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryAllByRole("checkbox")).toHaveLength(0));
    expect(screen.getByRole("button", { name: "Show tasks" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("folds an uncontrolled list and says so once every task is done", async () => {
    const { rerender } = render(<SetupGuide {...WORDS} tasks={open()} />);
    expect(screen.queryByText("All set")).toBeNull();
    rerender(
      <SetupGuide {...WORDS} tasks={open().map((task) => ({ ...task, isComplete: true }))} />,
    );
    expect(screen.getByText("All set")).toBeTruthy();
    await waitFor(() => expect(screen.queryAllByRole("checkbox")).toHaveLength(0));
  });
});
