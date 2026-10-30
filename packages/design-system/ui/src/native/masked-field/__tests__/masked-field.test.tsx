/**
 * Stackra file contract:
 * Purpose: proves the native MaskedField hands the TextField the masked text, reports the raw value, moves the caret
 *          with the edit, opens the number pad for a digits-only pattern and runs the pattern left to right.
 * Boundary: jsdom with the house TextField and the design-system hook replaced by stand-ins.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { MaskedField } from "#native/masked-field/masked-field";

const state = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/text-field/text-field", () => ({
  TextField: (props: Record<string, unknown>) => {
    state.props = props;
    return null;
  },
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "ar", direction: "rtl" }),
}));

describe("MaskedField (native)", () => {
  it("masks the text, reports the raw value and moves the caret", () => {
    const onChange = vi.fn();
    render(<MaskedField label="Mobile" mask="999 999 9999" onChange={onChange} />);
    expect(state.props["keyboardType"]).toBe("number-pad");
    expect(state.props["style"]).toEqual({ writingDirection: "ltr", textAlign: "right" });
    act(() => (state.props["onChange"] as (text: string) => void)("0501"));
    expect(onChange).toHaveBeenLastCalledWith("0501");
    expect(state.props["value"]).toBe("050 1");
    expect(state.props["selection"]).toEqual({ start: 5, end: 5 });
  });
});
