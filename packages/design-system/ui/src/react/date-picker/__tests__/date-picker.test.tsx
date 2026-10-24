/**
 * Stackra file contract:
 * Purpose: proves the web DatePicker names its group by its label and its button by `calendarButtonLabel` (an English
 *          default or the prop), opens a named calendar dialog from the button, chooses a day by pointer and keyboard and
 *          reports it as a `CalendarDate`, closes on Escape without a change, moves between months, refuses a day outside
 *          the bounds or refused by `isDateUnavailable`, opens and closes under the control of the app (`isOpen`,
 *          `defaultOpen`, `onOpenChange`), holds a day or `null` whether controlled or not, shows the error only while
 *          invalid, keeps the required, disabled and read-only states (a disabled or read-only picker cannot open, a
 *          disabled one is left out of the submit), submits the day under its name, gives the segments and the button the
 *          24 pixel minimum, takes the variant and the full-width default, merges the caller's class, passes unknown
 *          props through, and refuses `fullWidth`, `children` and a value that is not a day.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks or the position of the popover.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0318 (decision 7); ADR 0055; ADR 0022
 *          (test placement); WCAG 2.2 SC 2.5.8.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-205 sta-350:P-079
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement, useState } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { DatePicker, type DatePickerProps } from "#react/date-picker/date-picker";

const MARCH_5 = new CalendarDate(2026, 3, 5);
const press = (element: HTMLElement) => act(() => element.click());
const key = (element: HTMLElement, name: string) => fireEvent.keyDown(element, { key: name });
const group = (name: string = "Due date") => screen.getByRole("group", { name });
const trigger = (name: string | RegExp = /Choose a date/) => screen.getByRole("button", { name });
const dialog = () => screen.queryByRole("dialog");
/** A day of the open calendar in 2026, found by its spoken name, for example `day("Friday, March 6")`. */
const day = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}, 2026`) });
/** The button that opens the calendar, found by its slot: React Aria hides it from the role queries while it is open. */
const openedTrigger = () =>
  document.querySelector<HTMLElement>('[data-slot="date-picker-trigger"]') as HTMLElement;
/** A month button of the open calendar; React Aria adds a second, visually hidden one for screen readers. */
const monthButton = (name: "Next" | "Previous") =>
  screen.getAllByRole("button", { name })[0] as HTMLElement;
/** The segments of the field, which React Aria leaves outside the open dialog's accessibility tree. */
const segments = () => document.querySelectorAll<HTMLElement>('[role="spinbutton"]');
const segment = (kind: string) => {
  const found = [...segments()].find((candidate) => candidate.dataset["type"] === kind);
  if (!found) throw new Error(`no ${kind} segment`);
  return found;
};
const shown = () => [...segments()].map((candidate) => candidate.textContent);
const open = () => press(trigger());

/** A picker whose value the test keeps in state, so the picker is controlled. */
function Controlled({ start }: { readonly start: CalendarDate | null }) {
  const [value, setValue] = useState<CalendarDate | null>(start);
  return <DatePicker label="Due date" value={value} onChange={setValue} />;
}

describe("DatePicker (web)", () => {
  it("names the group by its label and ties the description to it", () => {
    render(<DatePicker label="Due date" description="The day the invoice is due" />);
    const description = screen.getByText("The day the invoice is due");
    expect(group().getAttribute("aria-describedby")?.split(" ")).toContain(description.id);
  });

  it("is named by aria-label when there is no visible label", () => {
    const { container } = render(<DatePicker aria-label="Birthday" />);
    expect(group("Birthday")).toBeTruthy();
    expect(container.querySelector('[data-slot="label"]')).toBeNull();
    expect(container.querySelector('[data-slot="description"]')).toBeNull();
    expect(container.querySelector('[data-slot="error-message"]')).toBeNull();
  });

  it("shows the error message only while the picker is invalid, and reads it with the field", () => {
    const { rerender } = render(<DatePicker label="Due date" errorMessage="Pick a day" />);
    expect(screen.queryByText("Pick a day")).toBeNull();
    rerender(<DatePicker label="Due date" errorMessage="Pick a day" isInvalid />);
    const message = screen.getByText("Pick a day");
    expect(group().getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
    expect(segment("month").getAttribute("aria-invalid")).toBe("true");
  });

  describe("calendar button", () => {
    it("is named in English by default, with the field's label, and says it opens a dialog", () => {
      render(<DatePicker label="Due date" />);
      const button = trigger(/^Choose a date.*Due date/);
      expect(button.getAttribute("aria-haspopup")).toBe("dialog");
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });

    it("is named by calendarButtonLabel", () => {
      render(<DatePicker label="Due date" calendarButtonLabel="Choose the due date" />);
      expect(trigger(/^Choose the due date/)).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Choose a date/ })).toBeNull();
    });

    it("is at least 24 pixels square, as are the segments", () => {
      render(<DatePicker label="Due date" />);
      expect(trigger().classList.contains("size-6")).toBe(true);
      for (const candidate of segments()) {
        expect(candidate.classList.contains("min-h-6")).toBe(true);
        expect(candidate.classList.contains("min-w-6")).toBe(true);
      }
    });
  });

  describe("calendar", () => {
    it("opens from the button as a dialog named by the button's label, on the month of the value", () => {
      render(
        <DatePicker
          label="Due date"
          defaultValue={MARCH_5}
          calendarButtonLabel="Choose the due date"
        />,
      );
      expect(dialog()).toBeNull();
      press(trigger(/Choose the due date/));
      const opened = screen.getByRole("dialog", { name: "Choose the due date" });
      expect(within(opened).getByRole("grid", { name: "March 2026" })).toBeTruthy();
      expect(openedTrigger().getAttribute("aria-expanded")).toBe("true");
    });

    it("puts focus on the chosen day when it opens", () => {
      render(<DatePicker label="Due date" defaultValue={MARCH_5} />);
      open();
      expect(document.activeElement).toBe(day("Thursday, March 5"));
    });

    it("chooses a day by pointer, reports it as a CalendarDate, shows it in the field and closes", () => {
      const onChange = vi.fn();
      render(<DatePicker label="Due date" defaultValue={MARCH_5} onChange={onChange} />);
      open();
      press(day("Friday, March 6"));
      expect(onChange).toHaveBeenCalledOnce();
      const next = onChange.mock.calls[0]?.[0] as CalendarDate;
      expect(next).toBeInstanceOf(CalendarDate);
      expect(next.toString()).toBe("2026-03-06");
      expect(dialog()).toBeNull();
      expect(shown()).toEqual(["3", "6", "2026"]);
    });

    it("chooses a day from the keyboard alone", () => {
      const onChange = vi.fn();
      render(<DatePicker label="Due date" defaultValue={MARCH_5} onChange={onChange} />);
      open();
      key(document.activeElement as HTMLElement, "ArrowRight");
      key(document.activeElement as HTMLElement, "ArrowDown");
      key(document.activeElement as HTMLElement, "Enter");
      fireEvent.keyUp(document.activeElement as HTMLElement, { key: "Enter" });
      const chosen = onChange.mock.calls[0]?.[0] as CalendarDate;
      expect(chosen.toString()).toBe("2026-03-13");
    });

    it("closes on Escape without a change", () => {
      const onChange = vi.fn();
      render(<DatePicker label="Due date" defaultValue={MARCH_5} onChange={onChange} />);
      open();
      key(document.activeElement as HTMLElement, "Escape");
      expect(dialog()).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
      expect(shown()).toEqual(["3", "5", "2026"]);
    });

    it("moves to the next and the previous month", () => {
      render(<DatePicker label="Due date" defaultValue={MARCH_5} />);
      open();
      press(monthButton("Next"));
      expect(screen.getByRole("grid", { name: "April 2026" })).toBeTruthy();
      press(monthButton("Previous"));
      press(monthButton("Previous"));
      expect(screen.getByRole("grid", { name: "February 2026" })).toBeTruthy();
    });

    it("draws the calendar's header as a div, so it is not a banner landmark", () => {
      render(<DatePicker label="Due date" defaultValue={MARCH_5} />);
      open();
      const header = document.querySelector('[data-slot="calendar-header"]');
      expect(header?.tagName).toBe("DIV");
      expect(screen.queryByRole("banner")).toBeNull();
    });

    it("flips the chevrons of the month buttons in a right-to-left page", () => {
      render(<DatePicker label="Due date" defaultValue={MARCH_5} />);
      open();
      for (const name of ["Next", "Previous"] as const)
        expect(monthButton(name).classList.contains("rtl:[&_svg]:rotate-180!")).toBe(true);
    });

    it("starts from the first day of an empty picker's month and chooses a day", () => {
      const onChange = vi.fn();
      render(<DatePicker label="Due date" onChange={onChange} />);
      open();
      const cells = within(screen.getByRole("grid")).getAllByRole("button");
      press(cells[10] as HTMLElement);
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0]?.[0]).toBeInstanceOf(CalendarDate);
    });
  });

  describe("bounds and unavailable days", () => {
    it("refuses a day before the earliest and after the latest", () => {
      const onChange = vi.fn();
      render(
        <DatePicker
          label="Due date"
          defaultValue={MARCH_5}
          minValue={new CalendarDate(2026, 3, 3)}
          maxValue={new CalendarDate(2026, 3, 20)}
          onChange={onChange}
        />,
      );
      open();
      const cellOf = (name: string) => day(name).closest("td") as HTMLElement;
      expect(cellOf("Monday, March 2").getAttribute("aria-disabled")).toBe("true");
      expect(cellOf("Saturday, March 21").getAttribute("aria-disabled")).toBe("true");
      expect(cellOf("Tuesday, March 3").getAttribute("aria-disabled")).toBeNull();
      expect(day("Monday, March 2").hasAttribute("data-disabled")).toBe(true);
      press(day("Monday, March 2"));
      press(day("Saturday, March 21"));
      expect(onChange).not.toHaveBeenCalled();
      expect(dialog()).toBeTruthy();
    });

    it("refuses a day for which isDateUnavailable is true, asking it about CalendarDates", () => {
      const onChange = vi.fn();
      const isDateUnavailable = vi.fn((date: CalendarDate) => date.day === 6);
      render(
        <DatePicker
          label="Due date"
          defaultValue={MARCH_5}
          isDateUnavailable={isDateUnavailable}
          onChange={onChange}
        />,
      );
      open();
      expect(day("Friday, March 6").hasAttribute("data-unavailable")).toBe(true);
      press(day("Friday, March 6"));
      expect(onChange).not.toHaveBeenCalled();
      expect(isDateUnavailable.mock.calls.every(([date]) => date instanceof CalendarDate)).toBe(
        true,
      );
    });

    it("makes a typed day outside the bounds or refused invalid", () => {
      const props = {
        label: "Due date",
        errorMessage: "Closed that day",
        validationBehavior: "aria",
      } as const;
      const { rerender } = render(
        <DatePicker
          {...props}
          defaultValue={MARCH_5}
          isDateUnavailable={(date) => date.day === 5}
        />,
      );
      expect(segment("day").getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByText("Closed that day")).toBeTruthy();
      rerender(<DatePicker {...props} value={MARCH_5} maxValue={new CalendarDate(2026, 3, 4)} />);
      expect(segment("day").getAttribute("aria-invalid")).toBe("true");
      rerender(<DatePicker {...props} value={MARCH_5} maxValue={new CalendarDate(2026, 3, 31)} />);
      expect(segment("day").getAttribute("aria-invalid")).toBeNull();
    });
  });

  describe("open state", () => {
    it("is closed by default and reports each opening and closing", () => {
      const onOpenChange = vi.fn();
      render(<DatePicker label="Due date" defaultValue={MARCH_5} onOpenChange={onOpenChange} />);
      expect(dialog()).toBeNull();
      open();
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      key(document.activeElement as HTMLElement, "Escape");
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
    });

    it("starts open with defaultOpen", () => {
      render(<DatePicker label="Due date" defaultValue={MARCH_5} defaultOpen />);
      expect(dialog()).toBeTruthy();
    });

    it("follows isOpen when controlled, and asks to close without closing itself", () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <DatePicker
          label="Due date"
          defaultValue={MARCH_5}
          isOpen={false}
          onOpenChange={onOpenChange}
        />,
      );
      open();
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(dialog()).toBeNull();
      rerender(
        <DatePicker label="Due date" defaultValue={MARCH_5} isOpen onOpenChange={onOpenChange} />,
      );
      expect(dialog()).toBeTruthy();
      key(document.activeElement as HTMLElement, "Escape");
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(dialog()).toBeTruthy();
      rerender(
        <DatePicker
          label="Due date"
          defaultValue={MARCH_5}
          isOpen={false}
          onOpenChange={onOpenChange}
        />,
      );
      expect(dialog()).toBeNull();
    });
  });

  describe("value", () => {
    it("is empty with no value, showing a placeholder in each segment", () => {
      render(<DatePicker label="Due date" />);
      expect(shown()).toEqual(["mm", "dd", "yyyy"]);
    });

    it("reports a day typed into the field as a CalendarDate", () => {
      const onChange = vi.fn();
      render(<DatePicker label="Due date" defaultValue={MARCH_5} onChange={onChange} />);
      key(segment("day"), "ArrowUp");
      const typed = onChange.mock.calls[0]?.[0] as CalendarDate;
      expect(typed.toString()).toBe("2026-03-06");
      expect(shown()).toEqual(["3", "6", "2026"]);
    });

    it("shows the value it is given when controlled, null meaning empty", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <DatePicker label="Due date" value={MARCH_5} onChange={onChange} />,
      );
      open();
      press(day("Friday, March 6"));
      expect(onChange).toHaveBeenCalledOnce();
      // The app did not take the change, so the field still shows its value.
      expect(shown()).toEqual(["3", "5", "2026"]);
      rerender(<DatePicker label="Due date" value={null} onChange={onChange} />);
      expect(shown()).toEqual(["mm", "dd", "yyyy"]);
    });

    it("follows the state of an app that keeps the value", () => {
      render(<Controlled start={null} />);
      open();
      const cells = within(screen.getByRole("grid")).getAllByRole("button");
      press(cells[12] as HTMLElement);
      expect(shown()).not.toEqual(["mm", "dd", "yyyy"]);
    });

    it("submits the day under its name as an ISO date", () => {
      const { container } = render(
        <form>
          <DatePicker label="Due date" name="due" defaultValue={MARCH_5} />
        </form>,
      );
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("due")).toBe(
        "2026-03-05",
      );
    });
  });

  describe("required, disabled and read-only", () => {
    it("marks the picker required", () => {
      render(<DatePicker label="Due date" isRequired />);
      expect(segment("month").getAttribute("aria-required")).toBe("true");
    });

    it("cannot open and is left out of the submit when disabled", () => {
      const onOpenChange = vi.fn();
      const { container } = render(
        <form>
          <DatePicker
            label="Due date"
            name="due"
            defaultValue={MARCH_5}
            isDisabled
            onOpenChange={onOpenChange}
          />
        </form>,
      );
      expect(trigger().hasAttribute("disabled")).toBe(true);
      expect(segment("month").getAttribute("aria-disabled")).toBe("true");
      open();
      key(segment("day"), "ArrowUp");
      expect(dialog()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(shown()).toEqual(["3", "5", "2026"]);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).has("due")).toBe(
        false,
      );
    });

    it("cannot open or change by keyboard or pointer when read-only, keeps focus and submits the day", () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      const { container } = render(
        <form>
          <DatePicker
            label="Due date"
            name="due"
            defaultValue={MARCH_5}
            isReadOnly
            onChange={onChange}
            onOpenChange={onOpenChange}
          />
        </form>,
      );
      expect(segment("month").getAttribute("aria-readonly")).toBe("true");
      expect(trigger().hasAttribute("disabled")).toBe(true);
      open();
      expect(dialog()).toBeNull();
      const month = segment("month");
      month.focus();
      // React Aria's shortcut to open the calendar from the field does not open a read-only one either.
      fireEvent.keyDown(month, { key: "ArrowDown", altKey: true });
      expect(dialog()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
      key(month, "ArrowUp");
      key(month, "Backspace");
      expect(onChange).not.toHaveBeenCalled();
      expect(shown()).toEqual(["3", "5", "2026"]);
      expect(document.activeElement).toBe(month);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("due")).toBe(
        "2026-03-05",
      );
    });
  });

  describe("look", () => {
    it("is a primary, full-width picker by default and takes the secondary variant", () => {
      const { container, rerender } = render(<DatePicker label="Due date" />);
      const root = () => container.querySelector('[data-slot="date-picker"]');
      const box = () => container.querySelector('[data-slot="date-input-group"]');
      expect(root()?.classList.contains("w-full")).toBe(true);
      expect(box()?.classList.contains("date-input-group--full-width")).toBe(true);
      expect(box()?.classList.contains("date-input-group--primary")).toBe(true);
      rerender(<DatePicker label="Due date" isFullWidth={false} variant="secondary" />);
      expect(root()?.classList.contains("w-full")).toBe(false);
      expect(box()?.classList.contains("date-input-group--full-width")).toBe(false);
      expect(box()?.classList.contains("date-input-group--secondary")).toBe(true);
    });

    it("keeps the caller's class, given as text or as a function", () => {
      const { container, rerender } = render(<DatePicker label="Due date" className="mine" />);
      const root = () => container.querySelector('[data-slot="date-picker"]');
      expect(root()?.classList.contains("mine")).toBe(true);
      expect(root()?.classList.contains("w-full")).toBe(true);
      rerender(
        <DatePicker
          label="Due date"
          isFullWidth={false}
          className={({ isOpen }) => (isOpen ? "is-open" : "is-closed")}
        />,
      );
      expect(root()?.classList.contains("is-closed")).toBe(true);
      expect(root()?.classList.contains("w-full")).toBe(false);
    });

    it("passes unknown props through to HeroUI's root", () => {
      render(<DatePicker label="Due date" data-testid="root" />);
      expect(screen.getByTestId("root").getAttribute("data-slot")).toBe("date-picker");
    });
  });

  it("matches the shared contract and refuses `children` and a value that is not a day", () => {
    expectTypeOf<DatePickerProps>().toExtend<DatePickerContractProps>();
    // @ts-expect-error the picker draws its own parts
    const withChildren: DatePickerProps = { children: "x" };
    void withChildren;
    // @ts-expect-error the value is a CalendarDate or null, never text
    createElement(DatePicker, { value: "2026-03-05" });
    // @ts-expect-error the open state is a boolean
    createElement(DatePicker, { isOpen: "yes" });
  });
});
