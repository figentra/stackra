/**
 * Stackra file contract:
 * Purpose: proves the native SidePanel is the end-edge Drawer: closed is shut, open is the small width, expanded the
 *          full width, and closing the drawer moves an uncontrolled panel to closed and reports it.
 * Boundary: React Native does not render in vitest: the native Drawer is a recording stand-in that renders plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0022 (test placement); owner request 2026-10-29
 *          (STA-1371, side panel).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { SidePanel } from "#native/side-panel/side-panel";

vi.mock("#native/drawer/drawer", () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const Part = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const Drawer = ({
    isOpen,
    size,
    placement,
    label,
    onOpenChange,
    children,
  }: {
    isOpen: boolean;
    size: string;
    placement: string;
    label: string;
    onOpenChange: (isOpen: boolean) => void;
    children: ReactNode;
  }) => (
    <section
      aria-label={label}
      data-open={String(isOpen)}
      data-size={size}
      data-placement={placement}
    >
      <button type="button" onClick={() => onOpenChange(false)}>
        shut
      </button>
      {children}
    </section>
  );
  return {
    Drawer: Object.assign(Drawer, { Header: Part, Title: Part, Body: Part, Footer: Part }),
  };
});

describe("SidePanel (native)", () => {
  it("maps the states onto the end-edge drawer", () => {
    const { rerender } = render(
      <SidePanel label="Assistant" state="closed">
        <SidePanel.Body>hi</SidePanel.Body>
      </SidePanel>,
    );
    const drawer = screen.getByRole("region", { name: "Assistant" });
    expect(drawer.getAttribute("data-open")).toBe("false");
    expect(drawer.getAttribute("data-placement")).toBe("end");
    rerender(
      <SidePanel label="Assistant" state="open">
        hi
      </SidePanel>,
    );
    expect(drawer.getAttribute("data-open")).toBe("true");
    expect(drawer.getAttribute("data-size")).toBe("sm");
    rerender(
      <SidePanel label="Assistant" state="expanded">
        hi
      </SidePanel>,
    );
    expect(drawer.getAttribute("data-size")).toBe("full");
  });

  it("closes an uncontrolled panel when the drawer is dismissed", () => {
    const onStateChange = vi.fn();
    render(
      <SidePanel label="Assistant" defaultState="open" onStateChange={onStateChange}>
        hi
      </SidePanel>,
    );
    fireEvent.click(screen.getByRole("button", { name: "shut" }));
    expect(onStateChange).toHaveBeenCalledWith("closed");
    expect(screen.getByRole("region", { name: "Assistant" }).getAttribute("data-open")).toBe(
      "false",
    );
  });
});
