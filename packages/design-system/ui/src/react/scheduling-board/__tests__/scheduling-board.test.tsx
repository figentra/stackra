/**
 * Stackra file contract:
 * Purpose: proves the web SchedulingBoard: rows and a group heading that collapses; blocks named by title, time and
 *          row, a hold counting down; Next and Today report the day; read-only drops the slot buttons; a press reaches
 *          `onItemPress`; roving focus moves with the arrows; a keyboard range reaches `onSelectRange` on the slot grid;
 *          a keyboard move or row change reaches `onItemChange` with its conflicts (the board's and the screen's); a
 *          promise resolving `false` puts the block back and says so; Escape cancels; right to left mirrors the arrows;
 *          loading and empty boards say so.
 * Boundary: jsdom with the real HeroUI and React Aria components; UTC, a fixed now and a fixed day, 08:00 to 12:00 in
 *           30-minute slots. Pointer drags need layout, which jsdom lacks, so they are not driven here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); shared modules step 4a (LEADER, 2026-11-09).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";

import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import type { SchedulingBoardResource } from "#contracts/types/scheduling-board-resource.type";
import { SchedulingBoard } from "#react/scheduling-board/scheduling-board";

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 10, 9, hour, minute));
const RESOURCES: SchedulingBoardResource[] = [
  { id: "sara", label: "Sara" },
  { id: "court-1", label: "Court 1", group: "Courts" },
  { id: "court-2", label: "Court 2", group: "Courts" },
];
const ITEMS: SchedulingBoardItem[] = [
  {
    id: "lesson",
    resourceIds: ["court-1"],
    start: at(9),
    end: at(10),
    kind: "booking",
    title: "Padel lesson",
  },
  {
    id: "match",
    resourceIds: ["court-2"],
    start: at(9),
    end: at(9, 30),
    kind: "booking",
    title: "Match",
  },
  {
    id: "held",
    resourceIds: ["court-2"],
    start: at(11),
    end: at(11, 30),
    kind: "hold",
    title: "Held",
    expiresAt: at(7, 30),
  },
];
const base = {
  label: "Branch schedule",
  resources: RESOURCES,
  items: ITEMS,
  timeZone: "UTC",
  now: at(7),
  date: new CalendarDate(2026, 11, 9),
  startHour: 8,
  endHour: 12,
  slotMinutes: 30,
};
const LESSON = /^Padel lesson, 9:00\sAM – 10:00\sAM, Court 1$/;
const status = () => screen.getByRole("status").textContent ?? "";

/** The web SchedulingBoard. */
describe("SchedulingBoard (web)", () => {
  /** Rows sit under their group, blocks carry their words, and a group collapses. */
  it("draws rows and named blocks, and collapses a group", () => {
    render(<SchedulingBoard {...base} />);
    expect(screen.getByRole("region", { name: "Branch schedule" })).toBeTruthy();
    expect(screen.getByRole("grid", { name: "Branch schedule" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Monday, November 9, 2026" })).toBeTruthy();
    expect(screen.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual([
      "Sara",
      "Court 1",
      "Court 2",
    ]);
    expect(screen.getByRole("button", { name: LESSON })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^Held, 11:00\sAM – 11:30\sAM, Court 2$/ }),
    ).toBeTruthy();
    expect(screen.getByText(/^Lapses in 30/)).toBeTruthy();
    const toggle = screen.getByRole("button", { name: "Hide Courts" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(screen.queryByRole("rowheader", { name: "Court 1" })).toBeNull();
    expect(screen.getByRole("button", { name: "Show Courts" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  /** Next moves a day and Today comes back, each reported. */
  it("reports the day from Next and Today", () => {
    const onDateChange = vi.fn();
    render(<SchedulingBoard {...base} onDateChange={onDateChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onDateChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 11, 10));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(onDateChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 11, 9));
  });

  /** A read-only board keeps its blocks pressable and has no slot buttons. */
  it("drops the slot buttons when read-only and presses a block", () => {
    const onItemPress = vi.fn();
    const onSelectRange = vi.fn();
    const { rerender } = render(
      <SchedulingBoard {...base} onSelectRange={onSelectRange} onItemPress={onItemPress} />,
    );
    expect(screen.getAllByRole("button", { name: /^Free, / }).length).toBeGreaterThan(0);
    rerender(
      <SchedulingBoard
        {...base}
        readOnly
        onSelectRange={onSelectRange}
        onItemPress={onItemPress}
      />,
    );
    expect(screen.queryAllByRole("button", { name: /^Free, / })).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: LESSON }));
    expect(onItemPress).toHaveBeenCalledWith(ITEMS[0]);
  });

  /** One stop takes Tab; the arrows move along a row and between rows. */
  it("moves the roving focus with the arrows", () => {
    render(<SchedulingBoard {...base} onSelectRange={vi.fn()} />);
    const first = screen.getByRole("button", {
      name: /^Free, Sara, Monday, November 9, 2026 8:00\sAM$/,
    });
    expect(first.tabIndex).toBe(0);
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    const next = document.activeElement as HTMLElement;
    expect(next.getAttribute("aria-label")).toMatch(/^Free, Sara, .* 8:30\sAM$/);
    expect(next.tabIndex).toBe(0);
    fireEvent.keyDown(next, { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("aria-label")).toMatch(
      /^Free, Court 1, .* 8:30\sAM$/,
    );
  });

  /** Enter, Shift and Right, Enter selects two slots on the slot grid. */
  it("selects a range from the keyboard", () => {
    const onSelectRange = vi.fn();
    render(<SchedulingBoard {...base} onSelectRange={onSelectRange} />);
    const slot = screen.getByRole("button", {
      name: /^Free, Court 2, Monday, November 9, 2026 10:00\sAM$/,
    });
    fireEvent.keyDown(slot, { key: "Enter" });
    expect(status()).toMatch(/^Selecting from 10:00\sAM – 10:30\sAM/);
    fireEvent.keyDown(slot, { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(slot, { key: "Enter" });
    expect(onSelectRange).toHaveBeenCalledWith({
      resourceId: "court-2",
      start: at(10),
      end: at(11),
      conflicts: [],
    });
    expect(status()).toMatch(/^Selected: Court 2, 10:00\sAM – 11:00\sAM$/);
  });

  /** Escape drops a range in progress and says so. */
  it("cancels a keyboard range with Escape", () => {
    const onSelectRange = vi.fn();
    render(<SchedulingBoard {...base} onSelectRange={onSelectRange} />);
    const slot = screen.getByRole("button", {
      name: /^Free, Court 2, Monday, November 9, 2026 10:00\sAM$/,
    });
    fireEvent.keyDown(slot, { key: "Enter" });
    fireEvent.keyDown(slot, { key: "Escape" });
    expect(onSelectRange).not.toHaveBeenCalled();
    expect(status()).toBe("Cancelled");
  });

  /** m, Right, Enter moves a block one slot later and holds it there. */
  it("moves a block from the keyboard", () => {
    const onItemChange = vi.fn();
    render(<SchedulingBoard {...base} onItemChange={onItemChange} />);
    const block = screen.getByRole("button", { name: LESSON });
    fireEvent.keyDown(block, { key: "m" });
    expect(status()).toMatch(/^Moving Padel lesson\./);
    fireEvent.keyDown(block, { key: "ArrowRight" });
    fireEvent.keyDown(block, { key: "Enter" });
    expect(onItemChange).toHaveBeenCalledWith({
      itemId: "lesson",
      change: "move",
      fromResourceId: "court-1",
      toResourceId: "court-1",
      start: at(9, 30),
      end: at(10, 30),
      conflicts: [],
    });
    expect(
      screen.getByRole("button", { name: /^Padel lesson, 9:30\sAM – 10:30\sAM, Court 1$/ }),
    ).toBeTruthy();
  });

  /** Down moves a block to the next row, where the board finds an overlap. */
  it("moves a block to another row with the board's conflict", () => {
    const onItemChange = vi.fn();
    render(<SchedulingBoard {...base} onItemChange={onItemChange} />);
    const block = screen.getByRole("button", { name: LESSON });
    fireEvent.keyDown(block, { key: "m" });
    fireEvent.keyDown(block, { key: "ArrowDown" });
    expect(screen.getByText("Overlaps another booking")).toBeTruthy();
    fireEvent.keyDown(block, { key: "Enter" });
    expect(onItemChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fromResourceId: "court-1",
        toResourceId: "court-2",
        start: at(9),
        end: at(10),
        conflicts: [{ reason: "overlap", severity: "warn", message: "Overlaps another booking" }],
      }),
    );
  });

  /** A screen's own conflict shows in the hint and reaches the change. */
  it("passes the screen's conflicts on", () => {
    const onItemChange = vi.fn();
    const conflict = {
      reason: "coach_on_leave",
      severity: "warn",
      message: "Coach on leave",
    } as const;
    render(
      <SchedulingBoard {...base} onItemChange={onItemChange} conflictsOf={() => [conflict]} />,
    );
    const block = screen.getByRole("button", { name: LESSON });
    fireEvent.keyDown(block, { key: "m" });
    expect(screen.getByText("Coach on leave")).toBeTruthy();
    fireEvent.keyDown(block, { key: "ArrowRight" });
    fireEvent.keyDown(block, { key: "Enter" });
    expect(onItemChange).toHaveBeenCalledWith(expect.objectContaining({ conflicts: [conflict] }));
  });

  /** A promise resolving false puts the block back and says so. */
  it("puts a block back when the screen refuses", async () => {
    const onItemChange = vi.fn(() => Promise.resolve(false));
    render(<SchedulingBoard {...base} onItemChange={onItemChange} />);
    const block = screen.getByRole("button", { name: LESSON });
    fireEvent.keyDown(block, { key: "m" });
    fireEvent.keyDown(block, { key: "ArrowRight" });
    fireEvent.keyDown(block, { key: "Enter" });
    expect(
      screen
        .getByRole("button", { name: /^Padel lesson, 9:30\sAM – 10:30\sAM, Court 1$/ })
        .getAttribute("aria-busy"),
    ).toBe("true");
    expect(await screen.findByText("Padel lesson was put back")).toBeTruthy();
    expect(screen.getByRole("button", { name: LESSON })).toBeTruthy();
  });

  /** Right to left, Left is later. */
  it("mirrors the arrows right to left", () => {
    const onItemChange = vi.fn();
    render(
      <div dir="rtl">
        <SchedulingBoard {...base} onItemChange={onItemChange} />
      </div>,
    );
    const block = screen.getByRole("button", { name: LESSON });
    fireEvent.keyDown(block, { key: "m" });
    fireEvent.keyDown(block, { key: "ArrowLeft" });
    fireEvent.keyDown(block, { key: "Enter" });
    expect(onItemChange).toHaveBeenCalledWith(
      expect.objectContaining({ start: at(9, 30), end: at(10, 30) }),
    );
  });

  /** Loading shows a named skeleton; no resources says so. */
  it("says when it is loading or empty", () => {
    const { rerender } = render(<SchedulingBoard {...base} isLoading />);
    expect(screen.getByText("Loading the schedule")).toBeTruthy();
    expect(screen.queryByRole("grid")).toBeNull();
    rerender(<SchedulingBoard {...base} resources={[]} />);
    expect(screen.getByText("No resources to show")).toBeTruthy();
  });
});
