/**
 * Stackra file contract:
 * Purpose: proves the web Table's column layout: pinned columns stick at the logical start (after the selection
 *          boxes) and end with their offsets and cast a shadow only while rows scroll under them; a header's grip
 *          drags a column onto another header's half and reports the move, mirrored in RTL, and a cancelled,
 *          secondary-button or self drop moves nothing.
 * Boundary: jsdom with real HeroUI and React Aria; jsdom has no layout, so `elementFromPoint`, the header boxes and
 *           the scroll sizes are stubbed, and pointer capture is a no-op.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { TableColumn } from "#contracts/types/table-column.type";
import { Table } from "#react/table/table";

const ITEMS = [
  { id: "o1", customer: "Ada", city: "Riyadh", total: 12 },
  { id: "o2", customer: "Grace", city: "Jeddah", total: 30 },
];

const header = (name: string) => screen.getByRole("columnheader", { name }) as HTMLElement;
const gripOf = (name: string) =>
  header(name).querySelector<HTMLElement>("span.cursor-grab") as HTMLElement;

/** Points `elementFromPoint` at `target` and gives it a 100-wide box at 0. */
const aimAt = (target: HTMLElement | null) => {
  Object.defineProperty(document, "elementFromPoint", {
    value: () => target,
    configurable: true,
  });
  if (target)
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 100,
    } as DOMRect);
};

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}

      unobserve() {}

      disconnect() {}
    },
  );
  Element.prototype.setPointerCapture = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "elementFromPoint");
});

describe("Table columns (web)", () => {
  it("pins columns at the start after the boxes and at the end, with shadows that follow the scroll", () => {
    const columns: readonly TableColumn[] = [
      { id: "customer", label: "Customer", pin: "start", width: 200 },
      { id: "city", label: "City" },
      { id: "total", label: "Total", pin: "end" },
    ];
    const { container } = render(
      <Table label="Orders" items={ITEMS} columns={columns} selectionMode="multiple" />,
    );
    expect(header("Customer").style.position).toBe("sticky");
    expect(header("Customer").style.insetInlineStart).toBe("44px");
    expect(header("Total").style.insetInlineEnd).toBe("0px");
    expect(header("City").style.position).toBe("");
    expect(container.querySelector("[data-pin-shadow=start]")).not.toBeNull();
    expect(container.querySelector("[data-pin-shadow=end]")).not.toBeNull();
    const scroller =
      container.querySelector<HTMLElement>(".group\\/scroll") ??
      (screen.getByRole("grid").parentElement as HTMLElement);
    Object.defineProperty(scroller, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(scroller, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(scroller, "scrollLeft", {
      value: -100,
      configurable: true,
      writable: true,
    });
    fireEvent.scroll(scroller);
    expect(scroller.hasAttribute("data-scroll-start")).toBe(true);
    expect(scroller.hasAttribute("data-scroll-end")).toBe(true);
    // The same position again changes nothing.
    fireEvent.scroll(scroller);
    Object.defineProperty(scroller, "scrollLeft", { value: 0, configurable: true });
    fireEvent.scroll(scroller);
    expect(scroller.hasAttribute("data-scroll-start")).toBe(false);
  });

  const columns: readonly TableColumn[] = [
    { id: "customer", label: "Customer" },
    { id: "city", label: "City" },
    { id: "total", label: "Total" },
  ];

  it("drags a column by its grip onto another header's half and reports the move", () => {
    const onColumnMove = vi.fn();
    render(<Table label="Orders" items={ITEMS} columns={columns} onColumnMove={onColumnMove} />);
    const grip = gripOf("Customer");
    fireEvent.pointerDown(grip, { button: 0, pointerId: 1, clientX: 0 });
    expect(grip.hasAttribute("data-dragging")).toBe(true);
    aimAt(header("Total"));
    fireEvent.pointerMove(grip, { clientX: 80, clientY: 5 });
    expect(header("Total").className).toContain("shadow-[inset_-2px_0_0_var(--accent)]");
    fireEvent.pointerUp(grip, { clientX: 80, clientY: 5 });
    // After Total: the end of the order without Customer.
    expect(onColumnMove).toHaveBeenLastCalledWith("customer", 2);
    fireEvent.pointerDown(gripOf("Total"), { button: 0, pointerId: 1, clientX: 0 });
    aimAt(header("Customer"));
    fireEvent.pointerUp(gripOf("Total"), { clientX: 20, clientY: 5 });
    expect(onColumnMove).toHaveBeenLastCalledWith("total", 0);
  });

  it("mirrors the halves in RTL", () => {
    const onColumnMove = vi.fn();
    render(
      <I18nProvider locale="ar-SA">
        <Table label="Orders" items={ITEMS} columns={columns} onColumnMove={onColumnMove} />
      </I18nProvider>,
    );
    fireEvent.pointerDown(gripOf("Customer"), { button: 0, pointerId: 1, clientX: 0 });
    aimAt(header("City"));
    fireEvent.pointerUp(gripOf("Customer"), { clientX: 20, clientY: 5 });
    // The left half is the logical end in right to left: after City.
    expect(onColumnMove).toHaveBeenLastCalledWith("customer", 1);
  });

  it("moves nothing for a secondary button, a cancel, a drop on itself or off the headers", () => {
    const onColumnMove = vi.fn();
    render(<Table label="Orders" items={ITEMS} columns={columns} onColumnMove={onColumnMove} />);
    const grip = gripOf("City");
    fireEvent.pointerDown(grip, { button: 2, pointerId: 1 });
    expect(grip.hasAttribute("data-dragging")).toBe(false);
    fireEvent.pointerMove(grip, { clientX: 10 });
    fireEvent.pointerDown(grip, { button: 0, pointerId: 1 });
    aimAt(header("Total"));
    fireEvent.pointerMove(grip, { clientX: 10, clientY: 5 });
    fireEvent.pointerCancel(grip);
    expect(grip.hasAttribute("data-dragging")).toBe(false);
    fireEvent.pointerDown(grip, { button: 0, pointerId: 1 });
    aimAt(header("City"));
    fireEvent.pointerMove(grip, { clientX: 10, clientY: 5 });
    fireEvent.pointerUp(grip, { clientX: 10, clientY: 5 });
    fireEvent.pointerDown(grip, { button: 0, pointerId: 1 });
    aimAt(null);
    fireEvent.pointerUp(grip, { clientX: 10, clientY: 5 });
    expect(onColumnMove).not.toHaveBeenCalled();
  });
});
