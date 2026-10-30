/**
 * Stackra file contract:
 * Purpose: proves the native MaskedField's other modes: a letters pattern opens the full keyboard in capitals, a
 *          controlled field shows the caller's value and only reports edits, a default value starts masked with the
 *          caret at its end, an edit that changes nothing reports nothing, the caret follows the user's selection,
 *          and in English the text aligns left.
 * Boundary: jsdom with the house TextField and the design-system hook replaced by stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); ADR 0022 (test placement); STA-1371.
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
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));

/** Types `text` into the field. */
const type = (text: string): void =>
  act(() => (state.props["onChange"] as (next: string) => void)(text));

describe("MaskedField modes (native)", () => {
  it("opens the capital keyboard for a letters pattern and aligns left in English", () => {
    render(<MaskedField label="Plate" mask="AAA 9999" />);
    expect(state.props).toMatchObject({
      keyboardType: "default",
      autoCapitalize: "characters",
      autoCorrect: false,
      style: { writingDirection: "ltr", textAlign: "left" },
    });
  });

  it("starts from a default value, caret at the end, and follows the selection", () => {
    render(<MaskedField label="Mobile" mask="999 999" defaultValue="123456" />);
    expect(state.props["value"]).toBe("123 456");
    expect(state.props["selection"]).toEqual({ start: 7, end: 7 });
    act(() =>
      (state.props["onSelectionChange"] as (event: unknown) => void)({
        nativeEvent: { selection: { start: 2, end: 2 } },
      }),
    );
    expect(state.props["selection"]).toEqual({ start: 2, end: 2 });
  });

  it("shows the caller's value and reports only real edits", () => {
    const onChange = vi.fn();
    render(<MaskedField label="Mobile" mask="999 999" value="12" onChange={onChange} />);
    expect(state.props["value"]).toBe("12");
    type("123");
    expect(onChange).toHaveBeenLastCalledWith("123");
    expect(state.props["value"]).toBe("12");
    onChange.mockClear();
    type("12x");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("edits on its own without an onChange", () => {
    render(<MaskedField label="Mobile" mask="999 999" />);
    type("1234");
    expect(state.props["value"]).toBe("123 4");
  });
});
