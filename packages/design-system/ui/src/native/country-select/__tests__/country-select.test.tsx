/**
 * Stackra file contract:
 * Purpose: proves the native CountrySelect hands the house ComboBox the countries named in the locale (only those
 *          given, the preferred first), a label from the catalogue unless given, full width by default, and the field
 *          props it is handed.
 * Boundary: the house ComboBox is a recording stand-in; what the select hands it is checked.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { CountrySelect } from "#native/country-select/country-select";
import type { CountrySelectProps } from "#native/country-select/country-select.props";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

const state = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/combo-box/combo-box", () => ({
  ComboBox: (props: Record<string, unknown>) => {
    state.props = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const within = (props: CountrySelectProps) =>
  render(
    <DesignSystemContext value={{ locale: "en", direction: "ltr" } as DesignSystemState}>
      <CountrySelect {...props} />
    </DesignSystemContext>,
  );
const ids = () => (state.props["items"] as { id: string }[]).map((item) => item.id);

describe("CountrySelect (native)", () => {
  it("offers the given countries, preferred first, under the catalogue label", () => {
    within({ countries: ["EG", "SA", "AE"], preferred: ["SA"], value: "AE", onChange: undefined });
    expect(state.props).toMatchObject({
      label: "ui::country_select.label",
      isFullWidth: true,
      value: "AE",
    });
    expect(state.props).not.toHaveProperty("onChange");
    expect(ids()[0]).toBe("SA");
    expect(ids()).toHaveLength(3);
    expect(ids()).toEqual(expect.arrayContaining(["AE", "EG", "SA"]));
  });

  it("takes its own label and width", () => {
    within({ label: "Country", isFullWidth: false, countries: ["SA"] });
    expect(state.props).toMatchObject({ label: "Country", isFullWidth: false });
  });
});
