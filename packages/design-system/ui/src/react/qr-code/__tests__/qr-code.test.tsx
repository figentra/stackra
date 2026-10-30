/**
 * Stackra file contract:
 * Purpose: proves the web QrCode is an image named by its label, sized as asked, with the encoded path.
 * Boundary: jsdom over the real encoder.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { qrPathOf } from "#core/functions/qr-path-of.function";
import { QrCode } from "#react/qr-code/qr-code";

describe("QrCode (web)", () => {
  it("is a named image of the encoded value", () => {
    const { container } = render(
      <QrCode value="https://stackra.dev" label="Open stackra.dev" size={120} />,
    );
    const image = screen.getByRole("img", { name: "Open stackra.dev" });
    expect(image.getAttribute("width")).toBe("120");
    expect(container.querySelector("path")?.getAttribute("d")).toBe(
      qrPathOf("https://stackra.dev").path,
    );
  });
});
