/**
 * Stackra file contract:
 * Purpose: proves the web MoneyField shows minor units in the currency's format (two, three and zero digits), reads a
 *          typed amount back as minor units, steps by one major unit, keeps the largest amount when the user goes past
 *          it, follows the locale's digits, draws the currency picker only for two or more codes and reports a pick,
 *          and refuses `formatOptions`.
 * Boundary: jsdom with real HeroUI, React Aria and motion; the theme CSS is not loaded, so values are checked, not looks.
 * Runtime: browser
 * Governing contract: gap inventory row 2; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { I18nProvider } from "react-aria-components";

import type { MoneyFieldContractProps } from "#contracts/types/money-field-contract-props.type";
import { MoneyField } from "#react/money-field/money-field";
import type { MoneyFieldProps } from "#react/money-field/money-field.props";

const field = () => screen.getByRole("textbox", { name: "Price" }) as HTMLInputElement;
const typeInto = (text: string) => {
  fireEvent.change(field(), { target: { value: text } });
  fireEvent.blur(field());
};

describe("MoneyField (web)", () => {
  it("shows minor units in the currency's digits", () => {
    const { rerender } = render(<MoneyField label="Price" currency="USD" value={123_450} />);
    expect(field().value).toBe("$1,234.50");
    rerender(<MoneyField label="Price" currency="KWD" value={1500} />);
    expect(field().value).toMatch(/1\.500/);
    rerender(<MoneyField label="Price" currency="JPY" value={1500} />);
    expect(field().value).toMatch(/1,500$/);
    rerender(<MoneyField label="Price" currency="USD" value={null} />);
    expect(field().value).toBe("");
  });

  it("reads a typed amount back as minor units, without float error", () => {
    const onChange = vi.fn();
    render(<MoneyField label="Price" currency="USD" defaultValue={null} onChange={onChange} />);
    typeInto("19.99");
    expect(onChange).toHaveBeenLastCalledWith(1999);
    typeInto("0.29");
    expect(onChange).toHaveBeenLastCalledWith(29);
    typeInto("");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("steps by one major unit, or by the step in minor units", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <MoneyField label="Price" currency="USD" defaultValue={500} onChange={onChange} />,
    );
    act(() => screen.getByRole("button", { name: "Increase" }).click());
    expect(onChange).toHaveBeenLastCalledWith(600);
    unmount();
    render(
      <MoneyField label="Price" currency="USD" defaultValue={500} step={25} onChange={onChange} />,
    );
    act(() => screen.getByRole("button", { name: "Decrease" }).click());
    expect(onChange).toHaveBeenLastCalledWith(475);
  });

  it("keeps the largest amount when the user goes past it", () => {
    const onChange = vi.fn();
    render(
      <MoneyField
        label="Price"
        currency="SAR"
        defaultValue={9900}
        maxValue={10_000}
        onChange={onChange}
      />,
    );
    typeInto("150");
    expect(onChange).toHaveBeenLastCalledWith(10_000);
    act(() => screen.getByRole("button", { name: "Increase" }).click());
    expect(onChange).toHaveBeenLastCalledWith(10_000);
  });

  it("follows the locale's digits", () => {
    const onChange = vi.fn();
    render(
      <I18nProvider locale="ar-EG">
        <MoneyField label="Price" currency="EGP" defaultValue={1250} onChange={onChange} />
      </I18nProvider>,
    );
    expect(field().value).toMatch(/١٢٫٥٠/);
  });

  it("draws the currency picker only for two or more codes, and reports a pick", () => {
    const onCurrencyChange = vi.fn();
    const { rerender } = render(
      <MoneyField label="Price" currency="SAR" currencies={["SAR"]} currencyLabel="Currency" />,
    );
    expect(screen.queryByRole("button", { name: /Currency/ })).toBeNull();
    rerender(
      <MoneyField
        label="Price"
        currency="SAR"
        currencies={["SAR", "AED", "USD"]}
        currencyLabel="Currency"
        onCurrencyChange={onCurrencyChange}
      />,
    );
    const picker = screen.getByRole("button", { name: /Currency/ });
    expect(picker.textContent).toContain("SAR");
    act(() => picker.click());
    act(() => screen.getByRole("option", { name: "AED" }).click());
    expect(onCurrencyChange).toHaveBeenCalledWith("AED");
  });

  it("matches the shared contract and refuses formatOptions", () => {
    expectTypeOf<MoneyFieldProps>().toExtend<MoneyFieldContractProps>();
    // @ts-expect-error the format is the currency's
    createElement(MoneyField, { currency: "SAR", formatOptions: { style: "percent" } });
  });
});
