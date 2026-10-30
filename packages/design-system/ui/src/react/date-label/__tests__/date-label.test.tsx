/**
 * Stackra file contract:
 * Purpose: proves the web DateLabel draws a `<time>` with the ISO date and the full date on hover, joins the state's
 *          word to the short text, reads the full date to screen readers, maps the state to the chip's tone, takes
 *          the locale and calendar, draws nothing for an invalid date, and refuses `children` and `tone`.
 * Boundary: jsdom with real HeroUI; `useUiText` is replaced by one that writes the key and its values, so the words
 *          checked are the keys the catalogue must hold.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { DateLabel } from "#react/date-label/date-label";

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}(${Object.values(values).join("|")})` : key,
}));

const NOW = new Date(2026, 9, 28, 12);

describe("DateLabel (web)", () => {
  it("draws a time with the ISO date, the full date on hover, and a plain short text", () => {
    const { container } = render(<DateLabel date={new Date(2026, 9, 29)} now={NOW} />);
    const time = container.querySelector("time");
    expect(time?.getAttribute("dateTime")).toBe(new Date(2026, 9, 29).toISOString());
    expect(time?.getAttribute("title")).toBe("Thursday, October 29, 2026");
    expect(time?.querySelector("[aria-hidden]")?.textContent).toBe("tomorrow");
    expect(container.querySelector('[data-state="none"]')).toBeTruthy();
  });

  it("joins the state's word to the text and reads the full date out", () => {
    const { container } = render(
      <DateLabel kind="due" date={new Date(2026, 9, 25)} now={NOW} isAnimated={false} />,
    );
    const shown = "ui::date_label.with_state(ui::date_label.overdue|3 days ago)";
    expect(container.querySelector("[aria-hidden]")?.textContent).toBe(shown);
    expect(container.querySelector('[data-slot="visually-hidden"]')?.textContent).toBe(
      `ui::date_label.with_date(${shown}|Sunday, October 25, 2026)`,
    );
  });

  it("maps the state to the chip's tone", () => {
    const cases = [
      ["due", 25, "danger"],
      ["due", 29, "warning"],
      ["expiry", 20, "danger"],
      ["expiry", 30, "warning"],
      ["date", 20, "default"],
    ] as const;
    for (const [kind, day, tone] of cases) {
      const { container, unmount } = render(
        <DateLabel kind={kind} date={new Date(2026, 9, day)} now={NOW} isAnimated={false} />,
      );
      expect(container.querySelector(`.chip--${tone}`), `${kind} ${day}`).toBeTruthy();
      unmount();
    }
  });

  it("takes the locale and the calendar", () => {
    const { container } = render(
      <I18nProvider locale="ar-SA">
        <DateLabel date={new Date(2026, 9, 29)} now={NOW} calendar="islamic-umalqura" />
      </I18nProvider>,
    );
    expect(container.querySelector("[aria-hidden]")?.textContent).toBe("غدًا");
    expect(container.querySelector("time")?.getAttribute("title")).toMatch(/هـ/);
  });

  it("draws nothing for an invalid date", () => {
    const { container } = render(<DateLabel date="soon" now={NOW} />);
    expect(container.innerHTML).toBe("");
  });

  it("types: refuses `children` and `tone`", () => {
    // @ts-expect-error the label builds the children
    render(<DateLabel date={NOW}>x</DateLabel>);
    // @ts-expect-error the state picks the tone
    render(<DateLabel date={NOW} tone="success" />);
  });
});
