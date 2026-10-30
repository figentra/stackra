/**
 * Stackra file contract:
 * Purpose: proves the web CursorPagination draws a named landmark with a previous and a next button, disables each when
 *          its page does not exist or a page loads, calls the handlers once per press, shows the count as a polite
 *          status, draws one load-more button in its own form and nothing when there is nothing to draw, mirrors its
 *          arrows in right-to-left text, takes its texts from the caller, and passes unknown props through.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, and the Icon is replaced by a marker
 *          that records its name and mirror flag.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 4); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-142
import { act, render, screen, within } from "@testing-library/react";

import { CursorPagination } from "#react/cursor-pagination/cursor-pagination";
import type { CursorPaginationProps } from "#react/cursor-pagination/cursor-pagination.props";
import { isDirectionalIcon } from "#core/functions/is-directional-icon.function";

vi.mock("#react/icon/icon", () => ({
  Icon: ({ name, isMirroredInRtl }: { name: string; isMirroredInRtl?: boolean }) => (
    <i
      data-testid="icon"
      data-name={name}
      data-mirrored={String(isMirroredInRtl ?? isDirectionalIcon(name))}
    />
  ),
}));

const press = (element: HTMLElement) => act(() => element.click());
const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

describe("CursorPagination (web)", () => {
  it("is a navigation landmark with a default name, or the caller's", () => {
    const { rerender } = render(<CursorPagination hasMore />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeTruthy();
    rerender(<CursorPagination hasMore label="Orders pages" />);
    expect(screen.getByRole("navigation", { name: "Orders pages" })).toBeTruthy();
  });

  it("draws a previous and a next button, each calling its handler once per press", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<CursorPagination hasMore hasPrevious onPrevious={onPrevious} onNext={onNext} />);
    press(button("Previous"));
    press(button("Next"));
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("disables next without hasMore and previous without hasPrevious, and refuses their presses", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<CursorPagination hasMore={false} onPrevious={onPrevious} onNext={onNext} />);
    expect(button("Previous").disabled).toBe(true);
    expect(button("Next").disabled).toBe(true);
    press(button("Previous"));
    press(button("Next"));
    expect(onPrevious).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("refuses both presses while a page loads and keeps the buttons' names", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <CursorPagination hasMore hasPrevious isLoading onPrevious={onPrevious} onNext={onNext} />,
    );
    expect(button("Previous").disabled).toBe(true);
    press(button("Next"));
    press(button("Previous"));
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("shows the spinner on the button that was pressed and disables the other", () => {
    const { rerender } = render(<CursorPagination hasMore hasPrevious />);
    press(button("Previous"));
    rerender(<CursorPagination hasMore hasPrevious isLoading />);
    expect(button("Previous").hasAttribute("data-pending")).toBe(true);
    expect(button("Next").hasAttribute("data-pending")).toBe(false);
    expect(button("Next").disabled).toBe(true);
    rerender(<CursorPagination hasMore hasPrevious />);
    press(button("Next"));
    rerender(<CursorPagination hasMore hasPrevious isLoading />);
    expect(button("Next").hasAttribute("data-pending")).toBe(true);
    expect(button("Previous").hasAttribute("data-pending")).toBe(false);
    expect(button("Previous").disabled).toBe(true);
  });

  it("keeps the load-more button, disabled, once the last page has arrived", () => {
    const { rerender } = render(<CursorPagination mode="load-more" hasMore />);
    rerender(<CursorPagination mode="load-more" hasMore={false} />);
    expect(button("Load more").disabled).toBe(true);
  });

  it("shows a count, never a total, as a polite status", () => {
    const { rerender } = render(<CursorPagination hasMore count={20} />);
    expect(screen.getByRole("status").textContent).toBe("Showing 20 items");
    rerender(<CursorPagination hasMore count={1} />);
    expect(screen.getByRole("status").textContent).toBe("Showing 1 item");
    rerender(<CursorPagination hasMore count={3} countLabel={(count) => `${count} orders`} />);
    expect(screen.getByRole("status").textContent).toBe("3 orders");
    rerender(<CursorPagination hasMore />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("mirrors its arrows in right-to-left text", () => {
    render(<CursorPagination hasMore hasPrevious />);
    const icons = screen.getAllByTestId("icon");
    expect(icons.map((icon) => icon.dataset["name"])).toEqual(["chevron-left", "chevron-right"]);
    for (const icon of icons) expect(icon.dataset["mirrored"]).toBe("true");
  });

  it("draws one load-more button in its form, with no previous button", () => {
    const onNext = vi.fn();
    render(<CursorPagination mode="load-more" hasMore hasPrevious onNext={onNext} />);
    expect(screen.queryByRole("button", { name: "Previous" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    press(button("Load more"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("draws no load-more button at the end, keeps the count, and draws nothing without either", () => {
    const { container, rerender } = render(
      <CursorPagination mode="load-more" hasMore={false} count={40} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Showing 40 items");
    rerender(<CursorPagination mode="load-more" hasMore={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("takes the texts of the buttons from the caller", () => {
    const { rerender } = render(
      <CursorPagination hasMore hasPrevious previousLabel="Zurück" nextLabel="Weiter" />,
    );
    expect(button("Zurück")).toBeTruthy();
    expect(button("Weiter")).toBeTruthy();
    rerender(<CursorPagination mode="load-more" hasMore loadMoreLabel="Mehr laden" />);
    expect(button("Mehr laden")).toBeTruthy();
  });

  it("passes unknown props and the class name to the nav element", () => {
    render(<CursorPagination hasMore data-testid="pages" className="mt-4" id="orders-pages" />);
    const nav = screen.getByTestId("pages");
    expect(nav.tagName).toBe("NAV");
    expect(nav.id).toBe("orders-pages");
    expect(nav.classList.contains("mt-4")).toBe(true);
    expect(within(nav).getAllByRole("button")).toHaveLength(2);
  });

  it("refuses a page number and the element's own aria-label at the type level", () => {
    // @ts-expect-error -- the pager is cursor-based: `page` is not a prop
    const withPage: CursorPaginationProps = { hasMore: true, page: 2 };
    // @ts-expect-error -- the landmark's name is the contract's `label`
    const withAria: CursorPaginationProps = { hasMore: true, "aria-label": "x" };
    expect([withPage, withAria]).toHaveLength(2);
  });
});
