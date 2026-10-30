/**
 * Stackra file contract:
 * Purpose: proves the web ExportDialog offers the formats, the scopes with their counts (a zero count disabled, the
 *          narrowest with rows chosen), the columns and the deliveries; refuses to export with no column; hands
 *          `onExport` the request, shows the button pending, then done with a polite announcement and closes; and
 *          keeps the dialog open with an alert when the export fails.
 * Boundary: jsdom with real HeroUI and React Aria; `useUiText` is replaced by a stand-in that echoes the key and its
 *           values, so the test does not depend on the catalogue's English.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 16; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { ExportRequest } from "#contracts/types/export-request.type";
import { ExportDialog } from "#react/export-dialog/export-dialog";
import type { ExportDialogProps } from "#react/export-dialog/export-dialog.props";

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
];
const COLUMNS = [
  { value: "sku", label: "SKU" },
  { value: "name", label: "Name" },
];

/** Renders the dialog open with the given overrides. */
function open(props: Partial<ExportDialogProps> = {}) {
  return render(
    <ExportDialog
      isOpen
      formats={FORMATS}
      columns={COLUMNS}
      counts={{ selection: 3, filtered: 0, all: 120 }}
      deliveries={["download", "email"]}
      email="ops@figentra.com"
      onExport={() => undefined}
      {...props}
    />,
  );
}

describe("ExportDialog (web)", () => {
  it("offers formats, scopes with counts, columns and deliveries", () => {
    open();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "CSV" })).toHaveProperty("checked", true);
    const selection = screen.getByRole("radio", { name: /scope_selection \{"count":3\}/ });
    expect(selection).toHaveProperty("checked", true);
    expect(screen.getByRole("radio", { name: /scope_filtered/ })).toHaveProperty("disabled", true);
    expect(screen.getByRole("checkbox", { name: "SKU" })).toHaveProperty("checked", true);
    expect(
      screen.getByRole("radio", { name: /email_to \{"email":"ops@figentra.com"\}/ }),
    ).toBeTruthy();
  });

  it("hides the scope, column and delivery pickers when there is nothing to choose", () => {
    open({ columns: undefined, counts: { all: 10 }, deliveries: undefined });
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("radio", { name: /scope_all/ })).toBeNull();
    expect(screen.queryByRole("radio", { name: /download/ })).toBeNull();
  });

  it("refuses to export without a column", () => {
    open();
    fireEvent.click(screen.getByRole("checkbox", { name: "SKU" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Name" }));
    const exportButton = screen.getByRole("button", { name: /\.export$/ });
    expect(
      exportButton.hasAttribute("disabled") ||
        exportButton.getAttribute("aria-disabled") === "true",
    ).toBe(true);
  });

  it("exports the request, pends, then shows done, announces and closes", async () => {
    let finish: (() => void) | undefined;
    const onExport = vi.fn(
      (_request: ExportRequest) =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const onOpenChange = vi.fn();
    open({ onExport, onOpenChange });
    fireEvent.click(screen.getByRole("radio", { name: "Excel" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Name" }));
    fireEvent.click(screen.getByRole("button", { name: /\.export$/ }));
    expect(onExport).toHaveBeenCalledWith(
      { format: "xlsx", columns: ["sku"], scope: "selection", delivery: "download" },
      expect.any(Function),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /\.export$/ }).getAttribute("data-pending")).toBe(
        "true",
      ),
    );
    await act(async () => {
      finish?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/done_download/));
    expect(screen.getByRole("button", { name: /\.done$/ }).getAttribute("data-phase")).toBe("done");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false), { timeout: 3000 });
  });

  it("stays open with an alert when the export fails", async () => {
    const onOpenChange = vi.fn();
    open({ onExport: () => Promise.reject(new Error("gateway")), onOpenChange });
    fireEvent.click(screen.getByRole("button", { name: /\.export$/ }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/failed/));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("fills a progress bar from onExport's progress while the file is prepared", async () => {
    let report: ((fraction: number) => void) | undefined;
    open({
      onExport: (_request, progress) => {
        report = progress;
        return new Promise<void>(() => {});
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /\.export$/ }));
    const bar = await screen.findByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBeNull();
    act(() => report?.(0.5));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");
  });
});
