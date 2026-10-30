/**
 * Stackra file contract:
 * Purpose: proves the web DropZone: it names itself for one file or many, shows the description and the browse
 *          button, and a drop keeps only the accepted files (by extension, wildcard or exact type), the first one
 *          unless it allows many, and reports nothing when none is accepted.
 * Boundary: jsdom has no DataTransfer, so the drag events carry a hand-made one with file items.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { DropZone } from "#react/drop-zone/drop-zone";

const transferOf = (files: readonly File[]) => ({
  types: ["Files"],
  files,
  dropEffect: "none",
  effectAllowed: "all",
  items: files.map((file) => ({ kind: "file", type: file.type, getAsFile: () => file })),
  getData: () => "",
});

const drop = async (zone: HTMLElement, files: readonly File[]) => {
  const dataTransfer = transferOf(files);
  fireEvent.dragEnter(zone, { dataTransfer, clientX: 1, clientY: 1 });
  fireEvent.dragOver(zone, { dataTransfer, clientX: 1, clientY: 1 });
  await act(async () => {
    fireEvent.drop(zone, { dataTransfer, clientX: 1, clientY: 1 });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
};

const zoneOf = (text: string) => screen.getByText(text).closest('[data-rac=""]') as HTMLElement;

const PNG = new File(["x"], "a.png", { type: "image/png" });
const PDF = new File(["x"], "b.PDF", { type: "application/pdf" });
const CSV = new File(["x"], "c.csv", { type: "text/csv" });

describe("DropZone (web)", () => {
  it("names itself for one file and keeps only the first accepted one", async () => {
    const onSelect = vi.fn();
    render(
      <DropZone
        description="Images or PDF"
        acceptedFileTypes={["image/*", ".pdf"]}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("Images or PDF")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose a file" })).toBeTruthy();
    await drop(zoneOf("Drop a file here"), [CSV, PNG, PDF]);
    expect(onSelect).toHaveBeenCalledWith([PNG]);
  });

  it("keeps every accepted file when it allows many, and reports none when nothing fits", async () => {
    const onSelect = vi.fn();
    render(
      <DropZone allowsMultiple acceptedFileTypes={["text/csv", ".pdf"]} onSelect={onSelect} />,
    );
    expect(screen.getByRole("button", { name: "Choose files" })).toBeTruthy();
    await drop(zoneOf("Drop files here"), [CSV, PNG, PDF]);
    expect(onSelect).toHaveBeenLastCalledWith([CSV, PDF]);
    await drop(zoneOf("Drop files here"), [PNG]);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("accepts any file without a filter, and shows a custom label", async () => {
    const onSelect = vi.fn();
    render(<DropZone label="Attach" allowsMultiple onSelect={onSelect} />);
    await drop(zoneOf("Attach"), [PNG, CSV]);
    expect(onSelect).toHaveBeenCalledWith([PNG, CSV]);
  });
});
