/**
 * Stackra file contract:
 * Purpose: proves the DropZone page sits at /pro-drop-zone in the Pro group, titles the page and the document, draws the
 *          upload zone with its file picker and the three sample files in their states, each with a named remove button
 *          and the failed one with a named retry button, and a disabled zone.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProDropZone } from "#src/routes/pro-drop-zone/pro-drop-zone";
import { ProDropZoneRoute } from "#src/routes/pro-drop-zone/pro-drop-zone.route";

describe("ProDropZone", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-drop-zone in the Pro group, and titles the page and the document", () => {
    render(<ProDropZone />);
    expect(ProDropZoneRoute.path).toBe("/pro-drop-zone");
    expect(ProDropZoneRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: ProDropZoneRoute.title })).toBeTruthy();
    expect(document.title).toBe("DropZone · Stackra Playground");
  });

  it("draws the picker button and the file input, named", () => {
    render(<ProDropZone />);
    expect(screen.getAllByRole("button", { name: "Select files" })).toHaveLength(2);
    expect(document.querySelector('input[type="file"][aria-label="Choose files"]')).toBeTruthy();
  });

  it("lists the three sample files with named remove and retry buttons", () => {
    render(<ProDropZone />);
    for (const name of ["proposal.pdf", "logo.png", "export.csv"]) {
      expect(screen.getByText(name)).toBeTruthy();
      expect(screen.getByRole("button", { name: `Remove ${name}` })).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: "Try again to upload export.csv" })).toBeTruthy();
    expect(
      screen.getByRole("progressbar", { name: "Upload progress of proposal.pdf" }),
    ).toBeTruthy();
  });

  it("disables the second zone", () => {
    render(<ProDropZone />);
    const [, trigger] = screen.getAllByRole("button", {
      name: "Select files",
    }) as HTMLButtonElement[];
    expect(trigger?.disabled).toBe(true);
  });
});
