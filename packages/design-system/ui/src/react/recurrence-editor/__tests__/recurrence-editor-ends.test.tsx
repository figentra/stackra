/**
 * Stackra file contract:
 * Purpose: proves the rest of the web RecurrenceEditor: the interval writes INTERVAL above 1 and drops it at 1, with
 *          the unit words in the plural; the frequency select switches the rule (daily has no weekdays); "On a date"
 *          ends three months after the first day with an end-date field that moves UNTIL; the times field sets COUNT;
 *          "Never" drops both; the monthly choice goes back to the day of the month; a disabled editor turns its
 *          controls off.
 * Boundary: jsdom with real HeroUI and React Aria; English words from the catalogue.
 * Runtime: browser
 * Governing contract: RFC 5545; ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { RecurrenceEditor } from "#react/recurrence-editor/recurrence-editor";

/** 2026-10-13, the second Tuesday of October. */
const START = new CalendarDate(2026, 10, 13);

const summary = () => document.querySelector('[data-slot="recurrence-summary"]')?.textContent;

/** Types into a number field and leaves it, as React Aria commits on blur. */
function typeNumber(field: HTMLElement, value: string) {
  act(() => field.focus());
  fireEvent.change(field, { target: { value } });
  act(() => field.blur());
}

/** An editor that records each rule it writes. */
function renderEditor(defaultValue?: string) {
  const changes: string[] = [];
  const view = render(
    <RecurrenceEditor
      startDate={START}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      onChange={(value) => changes.push(value)}
    />,
  );
  return { ...view, last: () => changes.at(-1) };
}

describe("RecurrenceEditor ends and interval (web)", () => {
  it("writes INTERVAL above 1 and drops it again at 1", () => {
    const { last } = renderEditor();
    const every = screen.getByRole("textbox", { name: "Repeat every" });
    typeNumber(every, "2");
    expect(last()).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU");
    expect(summary()).toContain("Every 2 weeks on Tuesday");
    typeNumber(every, "1");
    expect(last()).toBe("FREQ=WEEKLY;BYDAY=TU");
  });

  it("switches the frequency from the select", async () => {
    const { last } = renderEditor();
    const trigger = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("week"));
    if (!trigger) throw new Error("no frequency select");
    await act(async () => {
      fireEvent.click(trigger);
    });
    const day = await screen.findByRole("option", { name: "day" });
    await act(async () => {
      fireEvent.click(day);
    });
    expect(last()).toBe("FREQ=DAILY");
    expect(screen.queryByRole("button", { name: "Tuesday" })).toBeNull();
    expect(summary()).toContain("Every day");
  });

  it("ends on a date three months on, moved from the end-date field", () => {
    const { last } = renderEditor();
    fireEvent.click(screen.getByRole("radio", { name: "On a date" }));
    expect(last()).toBe("FREQ=WEEKLY;BYDAY=TU;UNTIL=20270113");
    const field = screen.getByRole("group", { name: "End date" });
    const [, day] = within(field).getAllByRole("spinbutton");
    if (!day) throw new Error("no day segment");
    act(() => day.focus());
    fireEvent.keyDown(day, { key: "ArrowUp" });
    expect(last()).toBe("FREQ=WEEKLY;BYDAY=TU;UNTIL=20270114");
  });

  it("sets COUNT from the times field and drops the end on Never", () => {
    const { last } = renderEditor();
    fireEvent.click(screen.getByRole("radio", { name: "After a number of times" }));
    typeNumber(screen.getByRole("textbox", { name: "Times" }), "4");
    expect(last()).toBe("FREQ=WEEKLY;BYDAY=TU;COUNT=4");
    expect(summary()).toContain("4 times");
    fireEvent.click(screen.getByRole("radio", { name: "Never" }));
    expect(last()).toBe("FREQ=WEEKLY;BYDAY=TU");
    expect(screen.queryByRole("textbox", { name: "Times" })).toBeNull();
  });

  it("goes back to the day of the month", () => {
    const { last } = renderEditor("FREQ=MONTHLY;BYDAY=2TU");
    expect(screen.getByRole("radio", { name: "On the second Tuesday" })).toHaveProperty(
      "checked",
      true,
    );
    fireEvent.click(screen.getByRole("radio", { name: "On day 13" }));
    expect(last()).toBe("FREQ=MONTHLY;BYMONTHDAY=13");
  });

  it("turns its controls off when disabled", () => {
    render(<RecurrenceEditor startDate={START} isDisabled />);
    expect(screen.getByRole("textbox", { name: "Repeat every" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "Tuesday" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("radio", { name: "Never" }).hasAttribute("disabled")).toBe(true);
  });
});
