/**
 * Stackra file contract:
 * Purpose: proves the native Sheet draws the native Drawer from the bottom by default, detached unless `isDetached` is
 *          false, hands the contract's snap points, dismissal, label and open state through, sets the backdrop the
 *          drawer reads, and keeps the drawer's parts.
 * Boundary: the Drawer is a stand-in that records its props and the backdrop context; the drawer's own behaviour is
 *           its test's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { use, type ReactNode } from "react";

import { SheetBackdropContext } from "#native/sheet/sheet-backdrop-context";

/** The props and backdrop the stand-in drawer was last handed. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  backdrop: null as unknown,
}));

vi.mock("#native/drawer/drawer", () => {
  const Parts = {
    Header: () => null,
    Title: () => null,
    Body: () => null,
    Footer: () => null,
    Close: () => null,
  };
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- reason: vi.mock factories are hoisted and cannot reach the outer scope
  function Drawer(props: Record<string, unknown>) {
    received.props = props;
    received.backdrop = use(SheetBackdropContext);
    return props["children"] as ReactNode;
  }
  return { Drawer: Object.assign(Drawer, Parts) };
});

const { Sheet } = await import("#native/sheet/sheet");

describe("Sheet (native)", () => {
  it("is a bottom, detached drawer over the scrim by default", () => {
    render(<Sheet>x</Sheet>);
    expect(received.props["placement"]).toBe("bottom");
    expect(received.props["inset"]).toBe(true);
    expect(received.backdrop).toBe("opaque");
  });

  it("hands the contract through", () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet
        isOpen
        onOpenChange={onOpenChange}
        isDismissable={false}
        isDetached={false}
        snapPoints={[200, "80%"]}
        backdrop="blur"
        label="Filters"
      >
        x
      </Sheet>,
    );
    expect(received.props).toMatchObject({
      isOpen: true,
      onOpenChange,
      isDismissable: false,
      inset: false,
      snapPoints: [200, "80%"],
      label: "Filters",
    });
    expect(received.backdrop).toBe("blur");
  });

  it("keeps the drawer's parts", async () => {
    const { Drawer } = await import("#native/drawer/drawer");
    expect(Sheet.Title).toBe(Drawer.Title);
    expect(Sheet.Close).toBe(Drawer.Close);
  });
});
