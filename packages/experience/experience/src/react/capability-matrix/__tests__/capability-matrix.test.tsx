/**
 * Stackra file contract:
 * Purpose: proves the capability matrix is a real, labelled table: a caption, column and row headers, each state
 *          drawn with its word (never colour or an icon alone), a note shown as written, an empty cell for a left-out
 *          column, and a focusable region so the keyboard can scroll it.
 * Boundary: unit tier in jsdom, inside `DesignSystemProvider`; reads roles and text only.
 * Runtime: node
 * Governing contract: ADR 0022; WCAG 2.2 1.3.1, 1.4.1 and 2.1.1; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { CapabilityMatrix } from "#react/capability-matrix/capability-matrix";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

/** Two carriers by three capabilities. */
const MATRIX = (
  <DesignSystemProvider>
    <CapabilityMatrix
      label="Carriers by capability"
      rowHeader="Carrier"
      columns={[
        { id: "rates", label: "Rates" },
        { id: "zpl", label: "ZPL labels" },
        { id: "cod", label: "Cash on delivery" },
      ]}
      rows={[
        {
          name: "Aramex",
          group: "Saudi Arabia",
          cells: { rates: "yes", zpl: "coming", cod: "Up to 5,000 SAR" },
        },
        { name: "SMSA", cells: { rates: "yes", zpl: "no" } },
      ]}
      stateLabels={{ yes: "Yes", no: "No", coming: "Coming" }}
    />
  </DesignSystemProvider>
);

/** The matrix reads as a table to assistive technology. */
describe("CapabilityMatrix", () => {
  afterEach(cleanup);

  /** Caption, column headers and row headers name every cell. */
  it("is a captioned table with column and row headers", () => {
    render(MATRIX);
    const table = screen.getByRole("table", { name: "Carriers by capability" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Carrier", "Rates", "ZPL labels", "Cash on delivery"]);
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent),
    ).toEqual(["AramexSaudi Arabia", "SMSA"]);
  });

  /** Each state shows its word; a note is shown as written; a left-out column is empty. */
  it("shows every state as a word, notes as written, and nothing for a missing cell", () => {
    render(MATRIX);
    const [, aramex, smsa] = screen.getAllByRole("row");
    expect(
      within(aramex as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Yes", "Coming", "Up to 5,000 SAR"]);
    expect(
      within(smsa as HTMLElement)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Yes", "No", ""]);
  });

  /** A narrow screen scrolls the table inside a named region the keyboard can reach. */
  it("wraps the table in a focusable, named region", () => {
    render(MATRIX);
    const region = screen.getByRole("region", { name: "Carriers by capability" });
    expect(region.getAttribute("tabindex")).toBe("0");
  });
});
