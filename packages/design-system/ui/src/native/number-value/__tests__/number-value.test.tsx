/**
 * Stackra file contract:
 * Purpose: proves the native NumberValue, PercentValue, BytesValue and MoneyValue write in the locale, and QrCode is
 *          an image named by its label.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text is a stand-in; react-native-svg is a
 *           stand-in that renders nothing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { BytesValue } from "#native/number-value/bytes-value";
import { MoneyValue } from "#native/number-value/money-value";
import { PercentValue } from "#native/number-value/percent-value";
import { QrCode } from "#native/qr-code/qr-code";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("react-native-svg", () => ({ default: () => null, Path: () => null }));

describe("number values and QrCode (native)", () => {
  it("write shares, sizes and money", () => {
    render(
      <>
        <PercentValue value={0.25} />
        <BytesValue value={2048} base="binary" />
        <MoneyValue amount={1_200_000} currency="SAR" isCompact />
      </>,
    );
    expect(screen.getByText("25%")).toBeTruthy();
    expect(screen.getByText(/^2\skB$/u)).toBeTruthy();
    expect(screen.getByText(/SAR\s1\.2M/u)).toBeTruthy();
  });

  it("names the QR code", () => {
    render(<QrCode value="https://stackra.dev" label="Open stackra.dev" />);
    expect(screen.getByRole("image", { name: "Open stackra.dev" })).toBeTruthy();
  });
});
