/**
 * Stackra file contract:
 * Purpose: proves the web Barcode draws an image named by its value, left to right in any direction, with the digits
 *          under it (the EAN-13 check digit added), and shows an error line for an invalid value.
 * Boundary: jsdom; the encoders have their own tests in core.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Barcode } from "#react/barcode/barcode";

describe("Barcode (web)", () => {
  it("draws a Code 128 image named by the value, never mirrored", () => {
    render(<Barcode value="SKU-2048" />);
    const image = screen.getByRole("img", { name: "SKU-2048" });
    expect(image.getAttribute("dir")).toBe("ltr");
    expect(image.querySelector("path")?.getAttribute("d")).toMatch(/^M10 0h2v64h-2z/);
    expect(image.textContent).toBe("SKU-2048");
  });

  it("adds the EAN-13 check digit and takes a label", () => {
    render(<Barcode value="590123412345" format="ean13" label="Linen abaya, 5901234123457" />);
    const image = screen.getByRole("img", { name: "Linen abaya, 5901234123457" });
    expect(image.textContent).toBe("5901234123457");
  });

  it("hides the text on request and shows an error for an invalid value", () => {
    const { rerender } = render(<Barcode value="SKU-2048" showText={false} />);
    expect(screen.getByRole("img").textContent).toBe("");
    rerender(<Barcode value="5901234123458" format="ean13" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("This barcode can't be drawn: check the value.")).toBeTruthy();
  });
});
