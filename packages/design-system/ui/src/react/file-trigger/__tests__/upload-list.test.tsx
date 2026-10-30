/**
 * Stackra file contract:
 * Purpose: proves the web UploadList is a named list with one row per file, shows each state's text, the size in the
 *          locale's digits, a named progress ring while uploading, retry only for a failed file with `onRetry`, remove
 *          only with `onRemove`, each handing back the file's id, and keeps the file name's own direction.
 * Boundary: jsdom with real HeroUI and Motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 6.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { UploadItem } from "#contracts/types/upload-item.type";
import { UploadList } from "#react/file-trigger/upload-list";

const FILES: UploadItem[] = [
  { id: "a", name: "invoice-1042.pdf", size: 2_516_582, status: "uploading", progress: 40 },
  { id: "b", name: "menu.jpg", status: "done", previewSrc: "/menu.jpg" },
  { id: "c", name: "stock.csv", status: "error" },
  { id: "d", name: "logo.png", status: "queued" },
];

describe("UploadList (web)", () => {
  it("is a named list with a row and a state per file", () => {
    render(<UploadList items={FILES} />);
    const list = screen.getByRole("list", { name: "Uploads" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows.map((row) => row.dataset["status"])).toEqual([
      "uploading",
      "done",
      "error",
      "queued",
    ]);
    expect(rows[0]?.textContent).toContain("2.4 MB");
    expect(rows[1]?.textContent).toContain("Uploaded");
    expect(rows[2]?.textContent).toContain("Upload failed");
    expect(rows[3]?.textContent).toContain("Waiting");
    expect(screen.getByRole("progressbar", { name: "Uploading invoice-1042.pdf" })).toBeTruthy();
    expect(
      within(rows[0] as HTMLElement)
        .getByText("invoice-1042.pdf")
        .getAttribute("dir"),
    ).toBe("auto");
  });

  it("writes the size in Arabic digits and shows a file's own error", () => {
    render(
      <I18nProvider locale="ar-EG">
        <UploadList
          items={[
            FILES[0] as UploadItem,
            { id: "e", name: "x.pdf", status: "error", error: "Too large" },
          ]}
        />
      </I18nProvider>,
    );
    expect(screen.getAllByRole("listitem")[0]?.textContent).toMatch(/٢٫٤/u);
    expect(screen.getByText("Too large")).toBeTruthy();
  });

  it("offers retry for a failed file and remove for every file, handing back ids", () => {
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    const { rerender } = render(<UploadList items={FILES} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    rerender(<UploadList items={FILES} onRetry={onRetry} onRemove={onRemove} label="Receipts" />);
    expect(screen.getByRole("list", { name: "Receipts" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry stock.csv" }));
    expect(onRetry).toHaveBeenCalledWith("c");
    expect(screen.getAllByRole("button", { name: /^Retry/u })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Remove menu.jpg" }));
    expect(onRemove).toHaveBeenCalledWith("b");
    expect(screen.getAllByRole("button", { name: /^Remove/u })).toHaveLength(4);
  });
});
