/**
 * Stackra file contract:
 * Purpose: proves the web ResourceScheduler draws one named column per resource and day with each booking as a button
 *          announcing its time, shows processing gaps, and proposes changes from the keyboard: arrows move by a step,
 *          Shift resizes, left and right change column; a fixed booking proposes nothing; a pointer drag proposes the
 *          moved booking on release.
 * Boundary: jsdom; columns have no width there, so a drag moves in time only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { ResourceScheduler } from "#react/resource-scheduler/resource-scheduler";

const props = {
  label: "Bookings",
  view: "day" as const,
  days: ["2026-11-02"],
  resources: [
    { id: "sara", label: "Sara", labelText: "Sara" },
    { id: "lina", label: "Lina", labelText: "Lina" },
  ],
  startMinute: 540,
  endMinute: 1080,
  slotMinutes: 15,
  slotHeight: 20,
  formatMinute: (minute: number) =>
    `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`,
  formatDay: (day: string) => day,
  keyboardHint: "Arrows move, Shift and arrows resize",
};

const colour = {
  id: "bk_1",
  title: "Colour",
  day: "2026-11-02",
  resource: "sara",
  start: 600,
  end: 690,
  segments: [
    { offset: 0, duration: 30, kind: "busy" as const },
    { offset: 30, duration: 45, kind: "processing" as const },
    { offset: 75, duration: 15, kind: "busy" as const },
  ],
};
const fixed = {
  id: "bk_2",
  title: "Break",
  day: "2026-11-02",
  resource: "lina",
  start: 720,
  end: 750,
  isMovable: false,
};

const booking = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name},`) });

describe("ResourceScheduler (web)", () => {
  it("names the columns and the bookings and shows processing gaps", () => {
    const { container } = render(<ResourceScheduler {...props} events={[colour, fixed]} />);
    expect(screen.getByRole("list", { name: "Sara, 2026-11-02" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Lina, 2026-11-02" })).toBeTruthy();
    expect(booking("Colour").getAttribute("aria-label")).toBe(
      "Colour, Sara, 2026-11-02 10:00 – 11:30",
    );
    expect(container.querySelectorAll("[data-segment='processing']")).toHaveLength(1);
  });

  it("moves, resizes and changes column from the keyboard", () => {
    const onEventChange = vi.fn();
    render(<ResourceScheduler {...props} events={[colour]} onEventChange={onEventChange} />);
    fireEvent.keyDown(booking("Colour"), { key: "ArrowDown" });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: 615, end: 705 }),
    );
    fireEvent.keyDown(booking("Colour"), { key: "ArrowUp", shiftKey: true });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: 600, end: 675 }),
    );
    fireEvent.keyDown(booking("Colour"), { key: "ArrowRight" });
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ resource: "lina", start: 600 }),
    );
  });

  it("proposes nothing for a fixed booking or a key that does nothing", () => {
    const onEventChange = vi.fn();
    render(<ResourceScheduler {...props} events={[fixed, colour]} onEventChange={onEventChange} />);
    fireEvent.keyDown(booking("Break"), { key: "ArrowDown" });
    fireEvent.keyDown(booking("Colour"), { key: "ArrowLeft" });
    fireEvent.keyDown(booking("Colour"), { key: "Enter" });
    expect(onEventChange).not.toHaveBeenCalled();
  });

  it("proposes the dragged booking on release", () => {
    const onEventChange = vi.fn();
    render(<ResourceScheduler {...props} events={[colour]} onEventChange={onEventChange} />);
    const target = booking("Colour");
    fireEvent.pointerDown(target, { clientX: 0, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(target, { clientX: 0, clientY: 140, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 0, clientY: 140, pointerId: 1 });
    expect(onEventChange).toHaveBeenCalledWith(expect.objectContaining({ start: 630, end: 720 }));
  });
});
