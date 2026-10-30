/**
 * Stackra file contract:
 * Purpose: proves the native TimePicker is a TimeField with a clock button (named by the catalogue unless given) and
 *          a five-minute wheel step unless another is given.
 * Boundary: the TimeField is a recording stand-in; what the picker hands it is checked.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { TimePicker } from "#native/time-picker/time-picker";

const state = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/time-field/time-field", () => ({
  TimeField: (props: Record<string, unknown>) => {
    state.props = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

describe("TimePicker (native)", () => {
  it("adds a clock button and a five-minute step", () => {
    render(<TimePicker label="Start" />);
    expect(state.props).toMatchObject({
      label: "Start",
      minuteStep: 5,
      pickerButtonLabel: "ui::time_picker.open",
    });
  });

  it("takes the given button label and step", () => {
    render(<TimePicker label="Start" pickerButtonLabel="Clock" minuteStep={15} />);
    expect(state.props).toMatchObject({ minuteStep: 15, pickerButtonLabel: "Clock" });
  });
});
