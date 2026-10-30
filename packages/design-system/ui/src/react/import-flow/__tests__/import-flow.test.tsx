/**
 * Stackra file contract:
 * Purpose: proves the web ImportFlow: it guesses the first mapping from the columns, lists each column with its
 *          sample, blocks the check while a required field is unmatched, reports mapping changes, runs the dry run
 *          with the current mapping, then shows the review with its counts and issues, goes back, and imports only
 *          when something would change.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and text are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import type { ImportField } from "#contracts/types/import-field.type";
import { ImportFlow } from "#react/import-flow/import-flow";
import { ImportReview } from "#react/import-flow/import-review";

const press = (element: HTMLElement) => act(() => element.click());

const FIELDS: readonly ImportField[] = [
  { key: "email", label: "Email", isRequired: true },
  { key: "name", label: "Name" },
];

describe("ImportFlow (web)", () => {
  it("guesses the mapping, shows samples and runs the dry run with it", () => {
    const onDryRun = vi.fn();
    render(
      <ImportFlow
        columns={["email", "Full name"]}
        sample={{ email: "a@b.co" }}
        fields={FIELDS}
        onDryRun={onDryRun}
        onImport={vi.fn()}
      />,
    );
    expect(screen.getByText("Match the columns")).toBeTruthy();
    expect(screen.getByText("e.g. a@b.co")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    press(screen.getByRole("button", { name: "Check the file" }));
    expect(onDryRun).toHaveBeenCalledWith(expect.objectContaining({ email: "email" }));
  });

  it("blocks the check and names the missing required field until it is matched", () => {
    const onMappingChange = vi.fn();
    const onDryRun = vi.fn();
    render(
      <ImportFlow
        columns={["mail"]}
        fields={FIELDS}
        onMappingChange={onMappingChange}
        onDryRun={onDryRun}
        onImport={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Email");
    const check = screen.getByRole("button", { name: "Check the file" });
    expect(check.hasAttribute("disabled") || check.getAttribute("aria-disabled") === "true").toBe(
      true,
    );
    press(screen.getByRole("button", { name: /Field: mail/ }));
    press(within(screen.getByRole("listbox")).getByRole("option", { name: /Email/ }));
    expect(onMappingChange).toHaveBeenLastCalledWith({ mail: "email" });
    expect(screen.queryByRole("alert")).toBeNull();
    press(screen.getByRole("button", { name: /Field: mail/ }));
    press(within(screen.getByRole("listbox")).getByRole("option", { name: "Skip this column" }));
    expect(onMappingChange).toHaveBeenLastCalledWith({ mail: null });
  });

  it("shows the review, goes back and imports with the controlled mapping", () => {
    const onImport = vi.fn();
    const onBack = vi.fn();
    render(
      <ImportFlow
        columns={["email"]}
        fields={FIELDS}
        mapping={{ email: "email" }}
        dryRun={{
          created: 2,
          updated: 1,
          failed: 1,
          issues: [{ row: 3, field: "email", message: "Bad" }],
        }}
        onDryRun={vi.fn()}
        onImport={onImport}
        onBack={onBack}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("To create");
    expect(screen.getByRole("region", { name: "Problems found" }).textContent).toContain("Row 3");
    press(screen.getByRole("button", { name: "Change the matching" }));
    expect(onBack).toHaveBeenCalled();
    press(screen.getByRole("button", { name: "Import" }));
    expect(onImport).toHaveBeenCalledWith({ email: "email" });
  });

  it("refuses to import when nothing would change", () => {
    const onImport = vi.fn();
    render(
      <ImportFlow
        columns={["email"]}
        fields={FIELDS}
        dryRun={{ created: 0, updated: 0, failed: 0, issues: [] }}
        onDryRun={vi.fn()}
        onImport={onImport}
      />,
    );
    expect(screen.getByText("No problems found")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Change the matching" })).toBeNull();
    press(screen.getByRole("button", { name: "Import" }));
    expect(onImport).not.toHaveBeenCalled();
  });
});

describe("ImportReview (web)", () => {
  it("shows the skipped count and the done labels with an issues action", () => {
    render(
      <ImportReview
        isDone
        result={{
          created: 1,
          updated: 0,
          skipped: 4,
          failed: 0,
          issues: [{ row: 1, field: "x", message: "m" }],
        }}
        issuesAction={<button type="button">Download</button>}
      />,
    );
    expect(screen.getByRole("status").children).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
  });
});
