/**
 * Stackra file contract:
 * Purpose: proves the web TimeField and TimePicker: a group named by its label with hour and minute segments, a time
 *          typed from the keyboard reported as `{ hour, minute }`, a cleared field reported as `null`, the description
 *          and error, and the picker's clock button that opens a named wheel dialog, picks a time and stays shut while
 *          disabled or read-only.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { TimeField } from "#react/time-field/time-field";
import { TimePicker } from "#react/time-picker/time-picker";

const press = (element: HTMLElement) => act(() => element.click());
const segment = (kind: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="spinbutton"]')].find(
    (candidate) => candidate.dataset["type"] === kind,
  ) as HTMLElement;

describe("TimeField (web)", () => {
  it("names the group by its label, shows the time and the description", () => {
    render(
      <TimeField
        label="Opens"
        description="Local time"
        hourCycle={24}
        defaultValue={{ hour: 9, minute: 5 }}
      />,
    );
    expect(screen.getAllByRole("group", { name: "Opens" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Local time")).toBeTruthy();
    expect(segment("hour").textContent).toBe("09");
    expect(segment("minute").textContent).toBe("05");
  });

  it("reports a time stepped from the keyboard and null once cleared", () => {
    const onChange = vi.fn();
    render(
      <TimeField
        label="Opens"
        hourCycle={24}
        defaultValue={{ hour: 9, minute: 0 }}
        onChange={onChange}
      />,
    );
    act(() => segment("hour").focus());
    fireEvent.keyDown(segment("hour"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 10, minute: 0 });
    for (const kind of ["minute", "minute", "hour", "hour"]) {
      act(() => segment(kind).focus());
      fireEvent.keyDown(segment(kind), { key: "Backspace" });
    }
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("shows the error while invalid and takes a caller class without filling the width", () => {
    const { container } = render(
      <TimeField
        aria-label="Opens"
        isInvalid
        errorMessage="Too early"
        isFullWidth={false}
        className="x-time"
      />,
    );
    expect(screen.getByText("Too early")).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain("x-time");
    expect((container.firstChild as HTMLElement).className).not.toContain("w-full");
  });
});

describe("TimePicker (web)", () => {
  it("opens a named wheel dialog from the clock button and picks a time", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <TimePicker label="Opens" hourCycle={24} onChange={onChange} onOpenChange={onOpenChange} />,
    );
    press(screen.getByRole("button", { name: "Choose a time" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const dialog = screen.getByRole("dialog", { name: "Choose a time" });
    fireEvent.keyDown(within(dialog).getAllByRole("listbox")[0] as HTMLElement, {
      key: "ArrowDown",
    });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 10, minute: 0 });
    expect(segment("hour").textContent).toBe("10");
  });

  it("keeps a controlled value and names the button by pickerButtonLabel", () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        label="Opens"
        hourCycle={24}
        value={{ hour: 8, minute: 30 }}
        onChange={onChange}
        pickerButtonLabel="Pick opening"
        defaultOpen
        minuteStep={15}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Pick opening" });
    fireEvent.keyDown(within(dialog).getAllByRole("listbox")[1] as HTMLElement, {
      key: "ArrowDown",
    });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 8, minute: 45 });
    expect(segment("minute").textContent).toBe("30");
  });

  it("stays shut while disabled or read-only", () => {
    const { rerender } = render(<TimePicker label="Opens" isDisabled isOpen />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a time" }).hasAttribute("disabled")).toBe(
      true,
    );
    rerender(<TimePicker label="Opens" isReadOnly isOpen />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
