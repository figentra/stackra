/**
 * Stackra file contract:
 * Purpose: proves the web FileTrigger names its button by source, sets the hidden input's accept, multiple and
 *          capture from the source, hands the picked files to `onSelect` and ignores an empty pick.
 * Boundary: jsdom with real React Aria and HeroUI; the picker is driven through the hidden input's `change`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 6.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { FileTrigger } from "#react/file-trigger/file-trigger";

const input = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>("input[type=file]");

describe("FileTrigger (web)", () => {
  it("names the button by source unless given children", () => {
    const { rerender } = render(<FileTrigger />);
    expect(screen.getByRole("button", { name: "Choose files" })).toBeTruthy();
    rerender(<FileTrigger source="photos" />);
    expect(screen.getByRole("button", { name: "Choose photos" })).toBeTruthy();
    rerender(<FileTrigger source="camera" />);
    expect(screen.getByRole("button", { name: "Take a photo" })).toBeTruthy();
    rerender(<FileTrigger>Upload receipt</FileTrigger>);
    expect(screen.getByRole("button", { name: "Upload receipt" })).toBeTruthy();
  });

  it("sets accept, multiple and capture from the source", () => {
    const { container, rerender } = render(
      <FileTrigger acceptedFileTypes={[".csv", "text/csv"]} allowsMultiple />,
    );
    expect(input(container)?.accept).toBe(".csv,text/csv");
    expect(input(container)?.multiple).toBe(true);
    rerender(<FileTrigger source="photos" acceptedFileTypes={[".csv"]} allowsMultiple />);
    expect(input(container)?.accept).toBe("image/*");
    rerender(<FileTrigger source="camera" allowsMultiple />);
    expect(input(container)?.multiple).toBe(false);
    expect(input(container)?.getAttribute("capture")).toBe("environment");
  });

  it("hands the picked files to onSelect and ignores an empty pick", () => {
    const onSelect = vi.fn();
    const { container } = render(<FileTrigger onSelect={onSelect} />);
    const file = new File(["sku,qty"], "stock.csv", { type: "text/csv" });
    fireEvent.change(input(container) as HTMLInputElement, { target: { files: [file] } });
    expect(onSelect).toHaveBeenCalledWith([file]);
    fireEvent.change(input(container) as HTMLInputElement, { target: { files: [] } });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
