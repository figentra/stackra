/**
 * Stackra file contract:
 * Purpose: proves the web `PdfPreview`: the frame is titled with the file, sends no referrer and is sandboxed; a
 *          cross-origin link may run the viewer's scripts in its own origin, a same-origin link gets no scripts; and the
 *          download button, named with the file, is the fallback.
 * Boundary: unit tier, jsdom; the frame loads nothing in jsdom, so its attributes are what is proved.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0302; Tamo spec generative-ui-tools-artifacts (G4)
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { PdfPreview } from "#react/pdf-preview/pdf-preview";

/** The web PdfPreview. */
describe("PdfPreview (web)", () => {
  /** A signed storage link: the viewer may run in that origin, never the page's. */
  it("shows a cross-origin PDF in a sandboxed, no-referrer frame with a download fallback", () => {
    const onDownload = vi.fn();
    render(
      <PdfPreview
        src="https://files.example.test/artifacts/scp_1/art_1/1.pdf?sig=1"
        name="Weekly sales.pdf"
        onDownload={onDownload}
      />,
    );
    const frame = screen.getByTitle("Preview of Weekly sales.pdf");
    expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts allow-same-origin allow-downloads");
    fireEvent.click(screen.getByRole("button", { name: "Download Weekly sales.pdf" }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  /** A link on the page's own origin could lift its sandbox with scripts, so it gets none. */
  it("gives a same-origin link no scripts, and no download button without onDownload", () => {
    render(<PdfPreview src="/files/report.pdf" name="report.pdf" />);
    expect(screen.getByTitle("Preview of report.pdf").getAttribute("sandbox")).toBe(
      "allow-downloads",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
