/**
 * Stackra file contract:
 * Purpose: proves the web AttachmentCard writes the type and size, names its buttons with the file, opens from the
 *          name, shows an upload's bar in place of the size, and a failure as an alert with retry and no download.
 * Boundary: jsdom with real HeroUI and React Aria; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { AttachmentCard } from "#react/attachment-card/attachment-card";

describe("AttachmentCard (web)", () => {
  it("writes the type and size and names its actions with the file", () => {
    const onOpen = vi.fn();
    const onDownload = vi.fn();
    const onRemove = vi.fn();
    render(
      <AttachmentCard
        name="invoice-1042.pdf"
        size={2_516_582}
        onOpen={onOpen}
        onDownload={onDownload}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText("\u2068PDF\u2069 · \u20682.4 MB\u2069")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "invoice-1042.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Download invoice-1042.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove invoice-1042.pdf" }));
    expect([onOpen, onDownload, onRemove].map((each) => each.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it("shows an upload's bar in place of the size, with no download", () => {
    render(<AttachmentCard name="menu.jpg" progress={40} onDownload={() => undefined} />);
    expect(screen.getByRole("progressbar", { name: "Uploading" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Download/u })).toBeNull();
  });

  it("says why an upload failed and offers a retry", () => {
    const onRetry = vi.fn();
    render(<AttachmentCard name="stock.csv" error="" onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toBe("Upload failed");
    fireEvent.click(screen.getByRole("button", { name: "Retry stock.csv" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
