/**
 * Stackra file contract:
 * Purpose: proves the native AddressField: a header label over five text fields named by the catalogue with their
 *          iOS autofill hints (line 1 and city required when the address is) and a country select; each edit reports
 *          the whole address and is kept when uncontrolled; a cleared country falls back to the default; the
 *          disabled and read-only states reach every part.
 * Boundary: React Native does not render in vitest, so it and the house TextField, CountrySelect and Text are
 *           recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          1.3.5; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { AddressField } from "#native/address-field/address-field";

const state = vi.hoisted(() => ({
  fields: {} as Record<string, Record<string, unknown>>,
  country: {} as Record<string, unknown>,
  texts: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      state.texts.push(props);
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/text-field/text-field", () => ({
  TextField: (props: Record<string, unknown>) => {
    state.fields[String(props["label"])] = props;
    return null;
  },
}));
vi.mock("#native/country-select/country-select", () => ({
  CountrySelect: (props: Record<string, unknown>) => {
    state.country = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const field = (part: string) => state.fields[`ui::address_field.${part}`] ?? {};
const type = (part: string, text: string) =>
  act(() => (field(part)["onChange"] as (next: string) => void)(text));
const chooseCountry = (code: string | null) =>
  act(() => (state.country["onChange"] as (next: string | null) => void)(code));

beforeEach(() => {
  state.fields = {};
  state.country = {};
  state.texts.length = 0;
});

describe("AddressField (native)", () => {
  it("draws a header and each part with its autofill hint, requiring line 1 and the city", () => {
    render(<AddressField label="Shipping" description="Where we deliver" isRequired />);
    expect(state.texts[0]).toMatchObject({ accessibilityRole: "header", children: "Shipping" });
    expect(screen.getByText("Where we deliver")).toBeTruthy();
    expect(
      ["line1", "line2", "city", "region", "postal_code"].map((part) => [
        field(part)["textContentType"],
        field(part)["isRequired"],
        field(part)["value"],
      ]),
    ).toEqual([
      ["streetAddressLine1", true, ""],
      ["streetAddressLine2", undefined, ""],
      ["addressCity", true, ""],
      ["addressState", undefined, ""],
      ["postalCode", undefined, ""],
    ]);
    expect(state.country).toMatchObject({ label: "ui::address_field.country", value: "SA" });
    expect(state.country).not.toHaveProperty("countries");
  });

  it("reports the whole address on each edit and keeps it", () => {
    const onChange = vi.fn();
    render(<AddressField onChange={onChange} defaultCountry="AE" countries={["AE", "SA"]} />);
    expect(state.country["countries"]).toEqual(["AE", "SA"]);
    type("line1", "1 Road");
    expect(onChange).toHaveBeenLastCalledWith({ line1: "1 Road", city: "", country: "AE" });
    type("postal_code", "123");
    expect(field("postal_code")["value"]).toBe("123");
    chooseCountry("SA");
    expect(onChange).toHaveBeenLastCalledWith({
      line1: "1 Road",
      city: "",
      postalCode: "123",
      country: "SA",
    });
    chooseCountry(null);
    expect(state.country["value"]).toBe("AE");
  });

  it("shows the owner's address and keeps it on an edit, locking every part", () => {
    const onChange = vi.fn();
    const value = { line1: "A", city: "B", country: "EG" };
    render(<AddressField value={value} onChange={onChange} isDisabled isReadOnly />);
    expect(field("line1")).toMatchObject({ value: "A", isDisabled: true, isReadOnly: true });
    expect(state.country).toMatchObject({ value: "EG", isDisabled: true, isReadOnly: true });
    type("city", "C");
    expect(onChange).toHaveBeenCalledWith({ line1: "A", city: "C", country: "EG" });
    expect(field("city")["value"]).toBe("B");
  });

  it("starts from defaultValue with no label", () => {
    render(<AddressField defaultValue={{ line1: "X", city: "Y", region: "Z", country: "SA" }} />);
    expect(field("region")["value"]).toBe("Z");
    expect(field("line1")).not.toHaveProperty("isDisabled");
    expect(state.texts).toHaveLength(0);
  });
});
