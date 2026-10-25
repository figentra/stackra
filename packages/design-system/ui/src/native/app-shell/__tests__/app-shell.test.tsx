/**
 * Stackra file contract:
 * Purpose: proves the native AppShell draws the header above the page, draws a string or number header or page inside
 *          Text, keeps the sidebar sheet closed until the open state opens it (uncontrolled, from `defaultOpen`, or
 *          controlled), draws the sidebar in a named sheet and tells a function `sidebar` it is in the drawer, reports
 *          the Close button, draws no sheet without a sidebar, ignores `collapseBelow` without forwarding it, passes
 *          unknown props through and refuses a missing page at the type level.
 * Boundary: React Native does not render in vitest: react-native, the native Drawer and Text are replaced by recording
 *           stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 4, 6 and 8); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-161
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import { AppShell, type AppShellProps } from "#native/app-shell/app-shell";

vi.mock("react-native", () => ({
  View: ({
    children,
    className,
    testID,
    ...rest
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      className={className as string | undefined}
      data-extra={Object.keys(rest).sort().join(",")}
    >
      {children}
    </div>
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span data-testid="text">{children}</span>,
}));
/** The Close button of the mocked drawer reaches the root through the `onOpenChange` the shell passed it. */
vi.mock("#native/drawer/drawer", async () => {
  const React = await import("react");
  const Context = React.createContext<((isOpen: boolean) => void) | undefined>(undefined);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const Drawer = ({
    isOpen,
    onOpenChange,
    label,
    children,
  }: {
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    label?: string;
    children?: ReactNode;
  }) =>
    isOpen ? (
      <Context.Provider value={onOpenChange}>
        <div role="dialog" aria-label={label}>
          {children}
        </div>
      </Context.Provider>
    ) : null;
  Drawer.Body = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  Drawer.Close = ({ label }: { label: string }) => {
    const close = React.use(Context);
    return <button type="button" aria-label={label} onClick={() => close?.(false)} />;
  };
  return { Drawer };
});

const page = <i data-testid="page" />;

describe("AppShell (native)", () => {
  it("draws the header above the page", () => {
    render(
      <AppShell header={<i data-testid="header" />} testID="shell">
        {page}
      </AppShell>,
    );
    const order = [...screen.getByTestId("shell").children].map(
      (child) =>
        child.querySelector("[data-testid]")?.getAttribute("data-testid") ??
        child.getAttribute("data-testid"),
    );
    expect(order[0]).toBe("header");
    expect(order[1]).toBe("page");
  });

  it("draws a string or number header or page inside Text, never bare in the View", () => {
    render(<AppShell header="Top">Page</AppShell>);
    expect(screen.getAllByTestId("text").map((node) => node.textContent)).toEqual(["Top", "Page"]);
  });

  it("keeps the sheet closed until the open state opens it", () => {
    render(<AppShell sidebar={<i data-testid="sidebar" />}>{page}</AppShell>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the sidebar in a sheet named for navigation with defaultOpen", () => {
    render(
      <AppShell sidebar={<i data-testid="sidebar" />} defaultOpen>
        {page}
      </AppShell>,
    );
    const dialog = screen.getByRole("dialog", { name: "Navigation menu" });
    expect(within(dialog).getByTestId("sidebar")).toBeTruthy();
  });

  it("tells a function sidebar it is in the drawer", () => {
    const sidebar = vi.fn(({ isInDrawer }: { isInDrawer: boolean }) => (
      <i data-testid="sidebar" data-in-drawer={String(isInDrawer)} />
    ));
    render(
      <AppShell sidebar={sidebar} defaultOpen>
        {page}
      </AppShell>,
    );
    expect(screen.getByTestId("sidebar").getAttribute("data-in-drawer")).toBe("true");
    expect(sidebar).toHaveBeenCalledWith({ isInDrawer: true });
  });

  it("closes from the Close button and reports it, uncontrolled", () => {
    const onOpenChange = vi.fn();
    render(
      <AppShell sidebar={<i />} defaultOpen onOpenChange={onOpenChange}>
        {page}
      </AppShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("follows isOpen when controlled, and only reports the request to close", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <AppShell sidebar={<i />} isOpen onOpenChange={onOpenChange}>
        {page}
      </AppShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(
      <AppShell sidebar={<i />} isOpen={false} onOpenChange={onOpenChange}>
        {page}
      </AppShell>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("draws no sheet without a sidebar", () => {
    render(<AppShell isOpen>{page}</AppShell>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ignores collapseBelow without forwarding it, and passes unknown props through", () => {
    render(
      <AppShell collapseBelow="xl" testID="shell" accessibilityHint="Frame">
        {page}
      </AppShell>,
    );
    const extra = screen.getByTestId("shell").getAttribute("data-extra") ?? "";
    expect(extra).toContain("accessibilityHint");
    expect(extra).not.toContain("collapseBelow");
  });

  it("refuses a missing page at the type level", () => {
    // @ts-expect-error: the page is required
    const refused: AppShellProps = { sidebar: undefined };
    expect(refused).toBeTruthy();
  });
});
