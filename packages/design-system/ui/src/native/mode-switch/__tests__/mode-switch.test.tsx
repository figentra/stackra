/**
 * Stackra file contract:
 * Purpose: proves the native ModeSwitch hands the native Switch its label, on for developer and off for normal (held or
 *          starting), and turns each change into the new mode.
 * Boundary: React Native does not render in vitest, so the package's native Switch is replaced by a recording stand-in.
 * Runtime: node
 * Governing contract: ADR 0359 (decisions 1 and 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { ModeSwitch } from "#native/mode-switch/mode-switch";

const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/switch/switch", () => ({
  Switch: (props: Record<string, unknown>) => {
    received.props = props;
    return null;
  },
}));

describe("ModeSwitch (native)", () => {
  it("maps the mode to the switch's state", () => {
    render(<ModeSwitch label="Developer mode" mode="developer" />);
    expect(received.props).toMatchObject({ label: "Developer mode", value: true });
    render(<ModeSwitch label="Developer mode" defaultMode="normal" />);
    expect(received.props).toMatchObject({ defaultValue: false });
    expect("value" in received.props).toBe(false);
  });

  it("turns each change into the new mode", () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch label="Developer mode" onModeChange={onModeChange} />);
    (received.props["onChange"] as (on: boolean) => void)(true);
    expect(onModeChange).toHaveBeenLastCalledWith("developer");
    (received.props["onChange"] as (on: boolean) => void)(false);
    expect(onModeChange).toHaveBeenLastCalledWith("normal");
  });
});
