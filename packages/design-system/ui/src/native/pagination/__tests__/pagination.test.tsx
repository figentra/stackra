/**
 * Stackra file contract:
 * Purpose: proves the native Pagination names its toolbar, writes the summary, selects the current page and moves
 *          by number and by next.
 * Boundary: react-native and heroui-native are the DOM stand-ins of `#testing/fakes/native-dom`; the Button,
 *           IconButton, Select and NumberField are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { Pagination } from "#native/pagination/pagination";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: { label: string; onPress: () => void }) =>
    createElement("button", { type: "button", "aria-label": props.label, onClick: props.onPress }),
}));
vi.mock("#native/button/button", () => ({ Button: () => null }));
vi.mock("#native/select/select", () => ({ Select: () => null }));
vi.mock("#native/number-field/number-field", () => ({ NumberField: () => null }));

describe("Pagination (native)", () => {
  it("names the toolbar, writes the summary and selects the current page", () => {
    render(<Pagination total={240} defaultPage={2} />);
    expect(screen.getByRole("toolbar", { name: "Pagination" })).toBeTruthy();
    expect(screen.getByText("11–20 of 240")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Page 2" }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("moves by number and by next", () => {
    const pages: number[] = [];
    render(<Pagination total={50} onPageChange={(page) => pages.push(page)} />);
    fireEvent.click(screen.getByRole("button", { name: "Page 4" }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(pages).toEqual([4, 5]);
  });
});
