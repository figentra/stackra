/**
 * Stackra file contract:
 * Purpose: proves the web DateField names its group by its label, ties the description and the error to it, shows the
 *          error only while the field is invalid, keeps the required, disabled and read-only states, holds a
 *          `CalendarDate` or `null` whether controlled or not and reports each change as one, makes a day before the
 *          earliest, after the latest or refused by `isDateUnavailable` invalid, submits the day under its name unless
 *          disabled, refuses every change to a disabled or read-only one, orders and writes the segments by the locale of
 *          the provider, gives each segment the 24 pixel minimum, takes the variant and the full-width default, passes
 *          unknown props through, and refuses `fullWidth`, `children` and a value that is not a day.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decision 7); ADR 0055; ADR 0022 (test
 *          placement); WCAG 2.2 SC 2.5.8.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-205 sta-350:P-079
import { CalendarDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, useState } from "react";
import { I18nProvider } from "react-aria-components";

import type { DateValueContractProps } from "#contracts/types/date-value-contract-props.type";
import { DateField, type DateFieldProps } from "#react/date-field/date-field";

const MARCH_5 = new CalendarDate(2026, 3, 5);
const key = (element: HTMLElement, name: string) => fireEvent.keyDown(element, { key: name });
// HeroUI's group and React Aria's date input both carry the field's group role and name, one inside the other.
const group = (name: string = "Due date") =>
  screen.getAllByRole("group", { name })[0] as HTMLElement;
const segments = () => screen.getAllByRole("spinbutton");
/** The text of each segment, for example `["3", "5", "2026"]`. */
const shown = () => segments().map((segment) => segment.textContent);
/** The segment of a kind: "month", "day" or "year". */
const segment = (kind: string) => {
  const found = segments().find((candidate) => candidate.dataset["type"] === kind);
  if (!found) throw new Error(`no ${kind} segment`);
  return found;
};

/** Whether the day segment says the field is invalid. */
const invalid = () => segment("day").getAttribute("aria-invalid") === "true";

/** A field whose value the test keeps in state, so the field is controlled. */
function Controlled({ start }: { readonly start: CalendarDate | null }) {
  const [value, setValue] = useState<CalendarDate | null>(start);
  return <DateField label="Due date" value={value} onChange={setValue} />;
}

describe("DateField (web)", () => {
  it("names the group by its label and ties the description to it", () => {
    render(<DateField label="Due date" description="The day the invoice is due" />);
    const description = screen.getByText("The day the invoice is due");
    expect(group().getAttribute("aria-describedby")?.split(" ")).toContain(description.id);
  });

  it("is named by aria-label when there is no visible label", () => {
    const { container } = render(<DateField aria-label="Birthday" />);
    expect(group("Birthday")).toBeTruthy();
    expect(container.querySelector('[data-slot="label"]')).toBeNull();
    expect(container.querySelector('[data-slot="description"]')).toBeNull();
    expect(container.querySelector('[data-slot="error-message"]')).toBeNull();
  });

  it("draws one editable segment for the month, the day and the year, each named with the field", () => {
    render(<DateField label="Due date" />);
    expect(segments().map((candidate) => candidate.dataset["type"])).toEqual([
      "month",
      "day",
      "year",
    ]);
    for (const kind of ["month", "day", "year"])
      expect(
        screen.getByRole("spinbutton", { name: new RegExp(`^${kind}.*Due date`) }),
      ).toBeTruthy();
  });

  it("shows the error message only while the field is invalid, and reads it with the field", () => {
    const { rerender } = render(<DateField label="Due date" errorMessage="Pick a day" />);
    expect(screen.queryByText("Pick a day")).toBeNull();
    rerender(<DateField label="Due date" errorMessage="Pick a day" isInvalid />);
    const message = screen.getByText("Pick a day");
    expect(group().getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
    expect(segment("month").getAttribute("aria-invalid")).toBe("true");
  });

  it("marks the field required, disabled and read-only", () => {
    const { rerender } = render(<DateField label="Due date" isRequired />);
    expect(segment("month").getAttribute("aria-required")).toBe("true");
    rerender(<DateField label="Due date" isDisabled />);
    expect(segment("month").getAttribute("aria-disabled")).toBe("true");
    rerender(<DateField label="Due date" isReadOnly defaultValue={MARCH_5} />);
    expect(segment("month").getAttribute("aria-readonly")).toBe("true");
    expect(segment("month").getAttribute("aria-disabled")).toBeNull();
  });

  describe("value", () => {
    it("is empty with no value, showing a placeholder in each segment", () => {
      render(<DateField label="Due date" />);
      expect(shown()).toEqual(["mm", "dd", "yyyy"]);
    });

    it("starts from the default value and reports a change as a CalendarDate", () => {
      const onChange = vi.fn();
      render(<DateField label="Due date" defaultValue={MARCH_5} onChange={onChange} />);
      expect(shown()).toEqual(["3", "5", "2026"]);
      key(segment("day"), "ArrowUp");
      expect(onChange).toHaveBeenCalledOnce();
      const next = onChange.mock.calls[0]?.[0] as CalendarDate;
      expect(next).toBeInstanceOf(CalendarDate);
      expect(next.toString()).toBe("2026-03-06");
      expect(shown()).toEqual(["3", "6", "2026"]);
    });

    it("keeps the day while a segment is cleared and reports null once every segment is", () => {
      const onChange = vi.fn();
      render(<DateField label="Due date" defaultValue={MARCH_5} onChange={onChange} />);
      key(segment("day"), "Backspace");
      expect(shown()).toEqual(["3", "dd", "2026"]);
      expect(onChange).not.toHaveBeenCalled();
      key(segment("month"), "Backspace");
      // Backspace takes one digit of the year at a time.
      for (let digit = 0; digit < 4; digit++) key(segment("year"), "Backspace");
      expect(shown()).toEqual(["mm", "dd", "yyyy"]);
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("shows the value it is given when controlled, null meaning empty", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <DateField label="Due date" value={MARCH_5} onChange={onChange} />,
      );
      key(segment("day"), "ArrowUp");
      expect(onChange).toHaveBeenCalledOnce();
      // The app did not take the change, so the field still shows its value.
      expect(shown()).toEqual(["3", "5", "2026"]);
      rerender(<DateField label="Due date" value={null} onChange={onChange} />);
      expect(shown()).toEqual(["mm", "dd", "yyyy"]);
    });

    it("follows the state of an app that keeps the value", () => {
      render(<Controlled start={MARCH_5} />);
      key(segment("month"), "ArrowUp");
      expect(shown()).toEqual(["4", "5", "2026"]);
    });

    it("submits the day under its name as an ISO date, and nothing while empty", () => {
      const { container, rerender } = render(
        <form>
          <DateField label="Due date" name="due" defaultValue={MARCH_5} />
        </form>,
      );
      const data = () => new FormData(container.querySelector("form") as HTMLFormElement);
      expect(data().get("due")).toBe("2026-03-05");
      rerender(
        <form>
          <DateField label="Due date" name="due" value={null} />
        </form>,
      );
      expect(data().get("due")).toBe("");
    });
  });

  describe("bounds and unavailable days", () => {
    it("makes a day before the earliest or after the latest invalid, and one between them valid", () => {
      const props = {
        label: "Due date",
        errorMessage: "Outside the term",
        minValue: new CalendarDate(2026, 3, 1),
        maxValue: new CalendarDate(2026, 3, 31),
        validationBehavior: "aria",
      } as const;
      const { rerender } = render(<DateField {...props} defaultValue={MARCH_5} />);
      expect(invalid()).toBe(false);
      expect(screen.queryByText("Outside the term")).toBeNull();
      rerender(<DateField {...props} defaultValue={new CalendarDate(2026, 2, 28)} />);
      expect(invalid()).toBe(false);
      rerender(<DateField {...props} value={new CalendarDate(2026, 2, 28)} />);
      expect(invalid()).toBe(true);
      expect(screen.getByText("Outside the term")).toBeTruthy();
      rerender(<DateField {...props} value={new CalendarDate(2026, 4, 1)} />);
      expect(invalid()).toBe(true);
      rerender(<DateField {...props} value={new CalendarDate(2026, 3, 31)} />);
      expect(invalid()).toBe(false);
    });

    it("makes a day refused by isDateUnavailable invalid, and asks it about CalendarDates", () => {
      const isDateUnavailable = vi.fn((date: CalendarDate) => date.day === 5);
      render(
        <DateField
          label="Due date"
          errorMessage="Closed that day"
          defaultValue={MARCH_5}
          isDateUnavailable={isDateUnavailable}
          validationBehavior="aria"
        />,
      );
      expect(invalid()).toBe(true);
      expect(screen.getByText("Closed that day")).toBeTruthy();
      expect(isDateUnavailable).toHaveBeenCalled();
      expect(isDateUnavailable.mock.calls.every(([date]) => date instanceof CalendarDate)).toBe(
        true,
      );
    });

    it("steps a segment into an unavailable day and reports the field invalid", () => {
      render(
        <DateField
          label="Due date"
          errorMessage="Closed that day"
          defaultValue={MARCH_5}
          isDateUnavailable={(date) => date.day === 6}
          validationBehavior="aria"
        />,
      );
      expect(invalid()).toBe(false);
      key(segment("day"), "ArrowUp");
      expect(invalid()).toBe(true);
    });

    it("by default flags a refused day when the field loses focus, not before", () => {
      render(
        <DateField
          label="Due date"
          errorMessage="Closed that day"
          defaultValue={MARCH_5}
          isDateUnavailable={(date) => date.day === 6}
        />,
      );
      const day = segment("day");
      day.focus();
      key(day, "ArrowUp");
      expect(invalid()).toBe(false);
      fireEvent.blur(day);
      expect(invalid()).toBe(true);
      expect(screen.getByText("Closed that day")).toBeTruthy();
    });
  });

  describe("disabled and read-only", () => {
    it("refuses every change when disabled and leaves the field out of the submit", () => {
      const onChange = vi.fn();
      const { container } = render(
        <form>
          <DateField
            label="Due date"
            name="due"
            defaultValue={MARCH_5}
            isDisabled
            onChange={onChange}
          />
        </form>,
      );
      key(segment("day"), "ArrowUp");
      key(segment("day"), "Backspace");
      expect(onChange).not.toHaveBeenCalled();
      expect(shown()).toEqual(["3", "5", "2026"]);
      // Out of the tab order: no segment can be focused from the keyboard.
      for (const candidate of segments()) expect(candidate.hasAttribute("tabindex")).toBe(false);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).has("due")).toBe(
        false,
      );
    });

    it("refuses the arrow keys and clearing when read-only, keeps focus and submits the day", () => {
      const onChange = vi.fn();
      const { container } = render(
        <form>
          <DateField
            label="Due date"
            name="due"
            defaultValue={MARCH_5}
            isReadOnly
            onChange={onChange}
          />
        </form>,
      );
      const month = segment("month");
      month.focus();
      key(month, "ArrowUp");
      key(month, "ArrowDown");
      key(month, "Backspace");
      expect(onChange).not.toHaveBeenCalled();
      expect(shown()).toEqual(["3", "5", "2026"]);
      expect(document.activeElement).toBe(month);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("due")).toBe(
        "2026-03-05",
      );
    });
  });

  describe("locale", () => {
    it("orders the segments by the locale of the provider", () => {
      render(
        <I18nProvider locale="de-DE">
          <DateField label="Due date" defaultValue={MARCH_5} />
        </I18nProvider>,
      );
      expect(segments().map((candidate) => candidate.dataset["type"])).toEqual([
        "day",
        "month",
        "year",
      ]);
      expect(shown()).toEqual(["5", "3", "2026"]);
    });

    it("writes the digits of the locale of the provider", () => {
      render(
        <I18nProvider locale="ar-EG">
          <DateField aria-label="Due date" defaultValue={MARCH_5} />
        </I18nProvider>,
      );
      expect(shown().join("")).toContain("٢٠٢٦");
    });
  });

  it("gives each segment the 24 pixel minimum of a target", () => {
    render(<DateField label="Due date" />);
    for (const candidate of segments()) {
      expect(candidate.classList.contains("min-h-6")).toBe(true);
      expect(candidate.classList.contains("min-w-6")).toBe(true);
    }
  });

  it("is a primary, full-width field by default and takes the secondary variant", () => {
    const { container, rerender } = render(<DateField label="Due date" />);
    const root = () => container.querySelector('[data-slot="date-field"]');
    const box = () => container.querySelector('[data-slot="date-input-group"]');
    expect(root()?.classList.contains("date-field--full-width")).toBe(true);
    expect(box()?.classList.contains("date-input-group--full-width")).toBe(true);
    expect(box()?.classList.contains("date-input-group--primary")).toBe(true);
    rerender(<DateField label="Due date" isFullWidth={false} variant="secondary" />);
    expect(root()?.classList.contains("date-field--full-width")).toBe(false);
    expect(box()?.classList.contains("date-input-group--full-width")).toBe(false);
    expect(box()?.classList.contains("date-input-group--secondary")).toBe(true);
  });

  it("passes unknown props through to HeroUI's root and keeps the caller's class", () => {
    render(<DateField label="Due date" className="mine" data-testid="root" />);
    expect(screen.getByTestId("root").classList.contains("mine")).toBe(true);
  });

  it("matches the shared contract and refuses `fullWidth`, `children` and a value that is not a day", () => {
    expectTypeOf<DateFieldProps>().toExtend<DateValueContractProps>();
    // @ts-expect-error `fullWidth` is `isFullWidth` in the contract
    createElement(DateField, { fullWidth: true });
    // @ts-expect-error the field draws its own parts
    const withChildren: DateFieldProps = { children: "x" };
    void withChildren;
    // @ts-expect-error the value is a CalendarDate or null, never text
    createElement(DateField, { value: "2026-03-05" });
  });
});
