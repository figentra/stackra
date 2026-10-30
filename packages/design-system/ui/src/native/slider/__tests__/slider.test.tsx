/**
 * Stackra file contract:
 * Purpose: proves the native Slider names HeroUI Native's slider by its label, writes unlabelled marks in the
 *          customer's digits, hides the marks from screen readers, and pairs a number input when asked.
 * Boundary: react-native and heroui-native are the DOM stand-ins of `#testing/fakes/native-dom`; the NumberField is a
 *           stand-in that records its props.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Slider } from "#native/slider/slider";

const seen = vi.hoisted(() => ({ input: undefined as Record<string, unknown> | undefined }));

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock(
  "heroui-native",
  async () => (await import("#testing/fakes/hero-native-dom")).heroNativeDom,
);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/number-field/number-field", () => ({
  NumberField: (props: Record<string, unknown>) => {
    seen.input = props;
    return null;
  },
}));

describe("Slider (native)", () => {
  it("writes the marks, hidden from screen readers", () => {
    render(<Slider label="Discount" marks={[{ value: 0 }, { value: 50, label: "Half" }]} />);
    expect(screen.getByText("Half")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("pairs a number input named by the label", () => {
    render(<Slider label="Budget" hasInput defaultValue={30} />);
    expect(seen.input).toMatchObject({ accessibilityLabel: "Budget", value: 30 });
  });
});
