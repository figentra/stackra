/**
 * Stackra file contract:
 * Purpose: proves the native LocaleSwitcher hands the house Select each locale named in its own language, a label
 *          from the catalogue unless given, and reports a chosen locale but never an empty choice.
 * Boundary: the house Select is a recording stand-in; what the switcher hands it is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { LocaleSwitcher } from "#native/locale-switcher/locale-switcher";

const state = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/select/select", () => ({
  Select: (props: Record<string, unknown>) => {
    state.props = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

describe("LocaleSwitcher (native)", () => {
  it("names each locale in its own language and reports a choice", () => {
    const onChange = vi.fn();
    render(<LocaleSwitcher locales={["en", "ar"]} value="en" onChange={onChange} />);
    expect(state.props).toMatchObject({ label: "ui::locale_switcher.label", value: "en" });
    expect(state.props).not.toHaveProperty("className");
    const items = state.props["items"] as { id: string; label: string }[];
    expect(items.map((item) => item.id)).toEqual(["en", "ar"]);
    expect(items[1]?.label).toBe("العربية");
    const change = state.props["onChange"] as (next: string | null) => void;
    change("ar");
    change(null);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("ar");
  });

  it("takes its own label and class, with no handler", () => {
    render(<LocaleSwitcher locales={["en"]} value="en" label="Language" className="x" />);
    expect(state.props).toMatchObject({ label: "Language", className: "x" });
    (state.props["onChange"] as (next: string) => void)("en");
  });
});
