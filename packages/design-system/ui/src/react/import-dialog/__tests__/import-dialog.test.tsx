/**
 * Stackra file contract:
 * Purpose: proves the web ImportDialog walks upload, match, review and import: a picked file is read and its columns
 *          matched automatically, the check waits for the required fields, the review counts new, updated, skipped and
 *          failed rows and offers the error list, the import fills a progress bar and ends on a summary; a failed read
 *          stays on the upload step with an alert, a failed check or import shows one, a failed import offers a retry,
 *          every step goes back, the error list downloads as a CSV, and Cancel and Done close the dialog.
 * Boundary: the component with the catalogue stubbed to its keys; the app's reader, dry run and import are fakes.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { ImportDryRun } from "#contracts/types/import-dry-run.type";
import { Button } from "#react/button/button";
import { ImportDialog } from "#react/import-dialog/import-dialog";
import type { ImportDialogProps } from "#react/import-dialog/import-dialog.props";

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const FIELDS = [
  { key: "name", label: "Name", isRequired: true },
  { key: "email", label: "Email", isRequired: true, aliases: ["e-mail"] },
  { key: "city", label: "City" },
];
const PREVIEW = { columns: ["Name", "E-mail", "City"], sample: { Name: "Sara" }, rowCount: 3 };
const DRY_RUN: ImportDryRun = {
  created: 2,
  updated: 0,
  skipped: 1,
  failed: 1,
  issues: [{ row: 3, field: "Email", message: "Not an email" }],
};

/** Renders the dialog open with the given overrides. */
function open(props: Partial<ImportDialogProps> = {}) {
  return render(
    <ImportDialog
      isOpen
      fields={FIELDS}
      onRead={() => Promise.resolve(PREVIEW)}
      onDryRun={() => Promise.resolve(DRY_RUN)}
      onImport={() => Promise.resolve()}
      {...props}
    />,
  );
}

/** Picks `name` through the drop zone's file input. */
async function pick(name = "customers.csv") {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { files: [new File(["x"], name, { type: "text/csv" })] } });
  });
}

const button = (name: RegExp) => screen.getByRole("button", { name });

describe("ImportDialog (web)", () => {
  it("starts on the upload step with the template link and CSV and Excel accepted", () => {
    open({ templateUrl: "/template.csv" });
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toContain("step_of");
    expect(screen.getByRole("link", { name: /\.template$/ }).getAttribute("href")).toBe(
      "/template.csv",
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe(".csv,.xlsx,.xls");
  });

  it("reads the file, matches the columns, checks, reviews and imports with progress", async () => {
    let report: ((fraction: number) => void) | undefined;
    let finish: (() => void) | undefined;
    const onDryRun = vi.fn(() => Promise.resolve(DRY_RUN));
    const onImport = vi.fn(
      (_mapping: unknown, progress: (fraction: number) => void) =>
        new Promise<void>((resolve) => {
          report = progress;
          finish = resolve;
        }),
    );
    open({ onDryRun, onImport });
    await pick();
    await screen.findByText("customers.csv");
    await act(async () => fireEvent.click(button(/import_flow\.check$/)));
    expect(onDryRun).toHaveBeenCalledWith({ Name: "name", "E-mail": "email", City: "city" });
    await screen.findByText("Not an email");
    expect(screen.getByText(/import_dialog\.skipped$/)).toBeTruthy();
    expect(button(/download_errors$/)).toBeTruthy();
    fireEvent.click(button(/import_flow\.import$/));
    const bar = await screen.findByRole("progressbar", { name: /importing$/ });
    expect(bar.getAttribute("aria-valuenow")).toBeNull();
    act(() => report?.(0.25));
    expect(
      screen.getByRole("progressbar", { name: /importing$/ }).getAttribute("aria-valuenow"),
    ).toBe("25");
    await act(async () => finish?.());
    await screen.findByText(/done_title$/);
    expect(button(/import_dialog\.done$/)).toBeTruthy();
  });

  it("waits for the required fields before the check", async () => {
    open({ onRead: () => Promise.resolve({ columns: ["Name", "Phone"] }) });
    await pick();
    await screen.findByRole("alert");
    expect(
      button(/import_flow\.check$/).hasAttribute("disabled") ||
        button(/import_flow\.check$/).getAttribute("data-disabled") === "true",
    ).toBe(true);
  });

  it("stays on the upload step with an alert when the file can't be read", async () => {
    open({ onRead: () => Promise.reject(new Error("bad")) });
    await pick("photo.csv");
    expect((await screen.findByRole("alert")).textContent).toContain("read_failed");
    expect(document.querySelector('input[type="file"]')).toBeTruthy();
  });

  it("offers a retry when the import fails", async () => {
    const onImport = vi
      .fn<ImportDialogProps["onImport"]>()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce(undefined);
    open({ onImport });
    await pick();
    await act(async () => fireEvent.click(await screen.findByRole("button", { name: /check$/ })));
    await screen.findByText("Not an email");
    await act(async () => fireEvent.click(button(/import_flow\.import$/)));
    expect((await screen.findByRole("alert")).textContent).toContain("import_failed");
    await act(async () => fireEvent.click(button(/retry$/)));
    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(2));
    await screen.findByText(/done_title$/);
  });
  it("goes back a step from each step, downloads the issues, and closes with Done", async () => {
    const onOpenChange = vi.fn();
    const createObjectURL = vi.fn(() => "blob:issues");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    open({ onOpenChange });
    await pick();
    await screen.findByText("customers.csv");
    fireEvent.click(button(/import_dialog\.back$/));
    expect(document.querySelector('input[type="file"]')).toBeTruthy();
    await pick();
    await act(async () => fireEvent.click(await screen.findByRole("button", { name: /check$/ })));
    await screen.findByText("Not an email");
    await act(async () => fireEvent.click(button(/download_errors$/)));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:issues"));
    fireEvent.click(button(/import_flow\.back$/));
    expect(button(/import_flow\.check$/)).toBeTruthy();
    await act(async () => fireEvent.click(button(/import_flow\.check$/)));
    await screen.findByText("Not an email");
    await act(async () => fireEvent.click(button(/import_flow\.import$/)));
    await act(async () =>
      fireEvent.click(await screen.findByRole("button", { name: /import_dialog\.done$/ })),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it("shows an alert when the check fails, and goes back to review after a failed import", async () => {
    const onDryRun = vi
      .fn<ImportDialogProps["onDryRun"]>()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue(DRY_RUN);
    open({ onDryRun, onImport: () => Promise.reject(new Error("down")) });
    await pick();
    await act(async () => fireEvent.click(await screen.findByRole("button", { name: /check$/ })));
    expect((await screen.findByRole("alert")).textContent).toContain("check_failed");
    await act(async () => fireEvent.click(button(/import_flow\.check$/)));
    await screen.findByText("Not an email");
    await act(async () => fireEvent.click(button(/import_flow\.import$/)));
    await screen.findByRole("alert");
    fireEvent.click(button(/import_dialog\.back$/));
    expect(await screen.findByText("Not an email")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("cancels from the upload step and opens from its trigger when uncontrolled", async () => {
    render(
      <ImportDialog
        trigger={<Button>Open import</Button>}
        fields={FIELDS}
        onRead={() => Promise.resolve(PREVIEW)}
        onDryRun={() => Promise.resolve(DRY_RUN)}
        onImport={() => Promise.resolve()}
        title="Customers"
        description="From a spreadsheet"
      />,
    );
    expect(screen.queryByText("From a spreadsheet")).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open import" })));
    expect(await screen.findByText("From a spreadsheet")).toBeTruthy();
    // An empty pick reads nothing.
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    await act(async () => fireEvent.click(button(/import_dialog\.cancel$/)));
    await waitFor(() => expect(screen.queryByText("From a spreadsheet")).toBeNull());
  });
});
