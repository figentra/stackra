/**
 * Stackra file contract:
 * Purpose: proves the native CursorPagination hands its View a name and the toolbar role, draws previous and next
 *          buttons that are disabled when their page does not exist or a page loads, calls the handlers, shows the count
 *          as a polite live region, draws one load-more button in its own form and nothing when there is nothing to
 *          draw, mirrors its arrows, and passes unknown props through.
 * Boundary: React Native does not render in vitest: react-native and the native Button, Icon and Text are replaced by
 *          recording stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 4 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-143
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { CursorPagination } from "#native/cursor-pagination/cursor-pagination";

const received = vi.hoisted(() => ({ buttons: [] as Record<string, unknown>[] }));

/** The real Button draws an icon element beside its label; a name is the registry's to draw, not this stand-in's. */
const drawn = (icon: unknown) => (typeof icon === "string" ? null : (icon as ReactNode));

vi.mock("react-native", () => ({
  View: ({
    children,
    accessibilityRole,
    accessibilityLabel,
    className,
    testID,
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      role={accessibilityRole as string | undefined}
      aria-label={accessibilityLabel as string | undefined}
      className={className as string | undefined}
    >
      {children}
    </div>
  ),
}));
vi.mock("#native/icon/icon", () => ({
  Icon: ({ name, isMirroredInRtl }: { name: string; isMirroredInRtl?: boolean }) => (
    <i data-testid="icon" data-name={name} data-mirrored={String(isMirroredInRtl === true)} />
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({
    children,
    accessibilityLiveRegion,
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <p data-testid="count" data-live={accessibilityLiveRegion as string | undefined}>
      {children}
    </p>
  ),
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown> & { children?: ReactNode }) => {
    received.buttons.push(props);
    return (
      <button
        type="button"
        data-loading={String(props["isLoading"] === true)}
        disabled={props["isDisabled"] === true || props["isLoading"] === true}
        onClick={() => (props["onPress"] as (() => void) | undefined)?.()}
      >
        {drawn(props["startIcon"])}
        {props.children}
        {drawn(props["endIcon"])}
      </button>
    );
  },
}));

const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

describe("CursorPagination (native)", () => {
  beforeEach(() => {
    received.buttons = [];
  });

  it("is a toolbar with a default name, or the caller's", () => {
    const { rerender } = render(<CursorPagination hasMore />);
    expect(screen.getByRole("toolbar", { name: "Pagination" })).toBeTruthy();
    rerender(<CursorPagination hasMore label="Orders pages" />);
    expect(screen.getByRole("toolbar", { name: "Orders pages" })).toBeTruthy();
  });

  it("draws previous and next buttons and calls each handler once per press", () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<CursorPagination hasMore hasPrevious onPrevious={onPrevious} onNext={onNext} />);
    fireEvent.click(button("Previous"));
    fireEvent.click(button("Next"));
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("disables next without hasMore and previous without hasPrevious", () => {
    render(<CursorPagination hasMore={false} />);
    expect(button("Previous").disabled).toBe(true);
    expect(button("Next").disabled).toBe(true);
  });

  it("refuses both presses while a page loads, with the spinner on next when no press started the load", () => {
    render(<CursorPagination hasMore hasPrevious isLoading />);
    expect(button("Previous").disabled).toBe(true);
    expect(button("Previous").dataset["loading"]).toBe("false");
    expect(button("Next").disabled).toBe(true);
    expect(button("Next").dataset["loading"]).toBe("true");
  });

  it("puts the spinner on the button that was pressed and disables the other", () => {
    const { rerender } = render(<CursorPagination hasMore hasPrevious />);
    fireEvent.click(button("Previous"));
    rerender(<CursorPagination hasMore hasPrevious isLoading />);
    expect(button("Previous").dataset["loading"]).toBe("true");
    expect(button("Next").dataset["loading"]).toBe("false");
    expect(button("Next").disabled).toBe(true);
  });

  it("hands the size to every button", () => {
    render(<CursorPagination hasMore hasPrevious size="lg" />);
    expect(received.buttons.map((props) => props["size"])).toEqual(["lg", "lg"]);
  });

  it("shows a count, never a total, as a polite live region", () => {
    const { rerender } = render(<CursorPagination hasMore count={20} />);
    expect(screen.getByTestId("count").textContent).toBe("Showing 20 items");
    expect(screen.getByTestId("count").dataset["live"]).toBe("polite");
    rerender(<CursorPagination hasMore count={1} />);
    expect(screen.getByTestId("count").textContent).toBe("Showing 1 item");
    rerender(<CursorPagination hasMore count={3} countLabel={(count) => `${count} orders`} />);
    expect(screen.getByTestId("count").textContent).toBe("3 orders");
    rerender(<CursorPagination hasMore />);
    expect(screen.queryByTestId("count")).toBeNull();
  });

  it("mirrors its arrows in right-to-left text", () => {
    render(<CursorPagination hasMore hasPrevious />);
    const icons = screen.getAllByTestId("icon");
    expect(icons.map((icon) => icon.dataset["name"])).toEqual(["chevron-left", "chevron-right"]);
    for (const icon of icons) expect(icon.dataset["mirrored"]).toBe("true");
  });

  it("draws one load-more button in its form, and nothing at the end without a count", () => {
    const onNext = vi.fn();
    const { container, rerender } = render(
      <CursorPagination mode="load-more" hasMore hasPrevious onNext={onNext} />,
    );
    expect(screen.queryByRole("button", { name: "Previous" })).toBeNull();
    fireEvent.click(button("Load more"));
    expect(onNext).toHaveBeenCalledOnce();
    rerender(<CursorPagination mode="load-more" hasMore={false} count={40} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("count").textContent).toBe("Showing 40 items");
    rerender(<CursorPagination mode="load-more" hasMore={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("passes unknown props to the view", () => {
    render(<CursorPagination hasMore testID="pages" className="mt-4" />);
    expect(screen.getByTestId("pages").className).toContain("mt-4");
  });
});
