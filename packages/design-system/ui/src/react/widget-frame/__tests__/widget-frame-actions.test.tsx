/**
 * Stackra file contract:
 * Purpose: proves the rest of the web `WidgetFrame`: the loading skeleton as a busy status, the description and footer,
 *          a spinner while refreshing without a refresh button, the full-screen view of the body, copying a link to the
 *          widget with a spoken notice that clears, and the PNG download of a drawn chart (none without one).
 * Boundary: jsdom with real HeroUI and English words; the clipboard and the PNG encoder are stand-ins, and the
 *           download is caught at `URL.createObjectURL`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { WidgetFrame } from "#react/widget-frame/widget-frame";

vi.mock("#react/widget-frame/svg-png-of.function", () => ({
  svgPngOf: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
}));

const openMenu = async (item: string) => {
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: item }));
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("WidgetFrame actions (web)", () => {
  it("shows a busy skeleton while loading, with its description and footer", () => {
    render(
      <WidgetFrame title="Sales" description="This week" footer="Source: POS" state="loading">
        body
      </WidgetFrame>,
    );
    expect(screen.getByRole("region", { name: "Sales" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status", { name: "Loading" })).toBeTruthy();
    expect(screen.getByText("This week")).toBeTruthy();
    expect(screen.getByText("Source: POS")).toBeTruthy();
    expect(screen.queryByText("body")).toBeNull();
  });

  it("shows a spinner while refreshing without a refresh button", () => {
    render(
      <WidgetFrame title="Sales" isRefreshing>
        body
      </WidgetFrame>,
    );
    expect(screen.getByRole("region", { name: "Sales" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.queryByRole("button", { name: "Refreshing" })).toBeNull();
  });

  it("names the refresh button as refreshing while it runs", () => {
    render(
      <WidgetFrame title="Sales" isRefreshing onRefresh={vi.fn()}>
        body
      </WidgetFrame>,
    );
    expect(screen.getByRole("button", { name: "Refreshing" })).toBeTruthy();
  });

  it("opens the body full screen and closes it", async () => {
    render(
      <WidgetFrame title="Sales" menu={["fullscreen"]}>
        <p>the chart</p>
      </WidgetFrame>,
    );
    await openMenu("Full screen");
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("the chart");
    fireEvent.click(within(dialog).getAllByRole("button").at(-1) as Element);
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("copies a link to the widget and says so until the notice clears", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(
      <WidgetFrame title="Sales" menu={["link"]}>
        body
      </WidgetFrame>,
    );
    await openMenu("Copy link");
    const region = screen.getByRole("region", { name: "Sales" });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(`#${region.id}`));
    await vi.waitFor(() => expect(screen.getByText("Link copied")).toBeTruthy());
    await vi.waitFor(() => expect(screen.queryByText("Link copied")).toBeNull(), { timeout: 3000 });
  });

  it("downloads a drawn chart as a PNG and does nothing without one", async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return "blob:png";
    });
    URL.revokeObjectURL = vi.fn();
    const { rerender } = render(
      <WidgetFrame title="Sales" fileName="sales" menu={["png"]}>
        <p>no chart</p>
      </WidgetFrame>,
    );
    await openMenu("Download PNG");
    expect(created).toHaveLength(0);
    rerender(
      <WidgetFrame title="Sales" fileName="sales" menu={["png"]}>
        <svg data-chart="" />
      </WidgetFrame>,
    );
    await openMenu("Download PNG");
    await act(async () => {});
    await vi.waitFor(() => expect(created[0]?.type).toBe("image/png"));
  });

  it("keeps the menu empty without actions and the CSV and table items off without data", async () => {
    const { rerender } = render(
      <WidgetFrame title="Sales" menu={[]}>
        body
      </WidgetFrame>,
    );
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
    rerender(
      <WidgetFrame title="Sales" menu={["csv", "table"]} size="full">
        body
      </WidgetFrame>,
    );
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      (await screen.findByRole("menuitem", { name: "Download CSV" })).getAttribute("aria-disabled"),
    ).toBe("true");
  });
});
