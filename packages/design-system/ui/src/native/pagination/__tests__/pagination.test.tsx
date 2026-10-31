/**
 * Stackra file contract:
 * Purpose: proves the native Pagination names its toolbar, writes the summary, selects the current page, moves by
 *          number, next and previous, draws an ellipsis for skipped pages (keyed apart from page numbers), changes the
 *          page size and jumps to a page.
 * Boundary: react-native and heroui-native are the DOM stand-ins of `#testing/fakes/native-dom`; the Button,
 *           IconButton, Select and NumberField are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { createElement } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Pagination } from "#native/pagination/pagination";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: { label: string; onPress: () => void }) =>
    createElement("button", { type: "button", "aria-label": props.label, onClick: props.onPress }),
}));
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));
vi.mock("#native/button/button", () => ({
  Button: (props: { isDisabled: boolean; onPress: () => void; children: string }) => {
    received.props["go"] = props;
    return createElement(
      "button",
      { type: "button", disabled: props.isDisabled, onClick: props.onPress },
      props.children,
    );
  },
}));
vi.mock("#native/select/select", () => ({
  Select: (props: Record<string, unknown>) => {
    received.props["sizes"] = props;
    return null;
  },
}));
vi.mock("#native/number-field/number-field", () => ({
  NumberField: (props: Record<string, unknown>) => {
    received.props["jump"] = props;
    return null;
  },
}));

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

  it("moves back, stops at the ends and draws an ellipsis for skipped pages", () => {
    const pages: number[] = [];
    render(
      <Pagination
        total={200}
        defaultPage={10}
        hasSummary={false}
        onPageChange={(page) => pages.push(page)}
      />,
    );
    expect(screen.queryByText(/of 200/)).toBeNull();
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(pages).toEqual([9]);
  });

  it("keys an ellipsis apart from the page whose number is its index", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    // Pages 1 … 4 5 6 … 20: the second ellipsis sits at index 5, beside page 5.
    render(<Pagination total={200} defaultPage={5} hasSummary={false} />);
    expect(errors.mock.calls.some(([message]) => String(message).includes("same key"))).toBe(false);
    errors.mockRestore();
  });

  it("changes the page size from the size select, ignoring an empty choice", () => {
    const sizes: number[] = [];
    render(
      <Pagination
        total={100}
        pageSizes={[10, 25]}
        onPageSizeChange={(size) => sizes.push(size)}
        label="Rows"
      />,
    );
    expect(screen.getByRole("toolbar", { name: "Rows" })).toBeTruthy();
    expect(received.props["sizes"]).toMatchObject({ value: "10", isFullWidth: false });
    const change = received.props["sizes"]?.["onChange"] as (key: string | null) => void;
    act(() => change("25"));
    act(() => change(null));
    expect(sizes).toEqual([25]);
    expect(received.props["sizes"]?.["value"]).toBe("25");
  });

  it("jumps to a typed page and clears the field", () => {
    const pages: number[] = [];
    render(<Pagination total={100} hasJump onPageChange={(page) => pages.push(page)} />);
    expect(received.props["jump"]).toMatchObject({ minValue: 1, maxValue: 10, value: null });
    expect((screen.getByText("Go") as HTMLButtonElement).disabled).toBe(true);
    const jumpTo = received.props["jump"]?.["onChange"] as (value: number) => void;
    act(() => jumpTo(7));
    fireEvent.click(screen.getByText("Go"));
    expect(pages).toEqual([7]);
    expect(received.props["jump"]?.["value"]).toBeNull();
    const go = received.props["go"]?.["onPress"] as () => void;
    go();
    expect(pages).toEqual([7]);
  });
});
