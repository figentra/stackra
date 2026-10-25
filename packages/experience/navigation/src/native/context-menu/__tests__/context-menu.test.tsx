// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the native `ContextMenu` over the template's order card menu: the entries reach the UI kit's
 *          menu translated, the route entry pushes its screen with params built from the value, the action entry runs
 *          its client with the built input in the danger tone, an action the session may not run is left out, and the
 *          menu opens from its child.
 * Boundary: test only; React Navigation, the native UI kit, the translator and the client hooks are replaced by
 *           recording stand-ins (none runs in vitest); the container is real.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0294 (decisions 14 and 16); ADR 0260 (decision 4).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { Menu } from "#core/bases/menu.base";
import { MenuKind } from "#core/enums/menu-kind.enum";
import { routeRef } from "#core/functions/route-ref.function";
import type { MenuBuilder } from "#core/types/menu-builder.type";
import { ContextMenu } from "#native/context-menu/context-menu";

interface UiItem {
  id: string;
  label: string;
  tone?: string;
  onPress?: () => void;
}

const seen = vi.hoisted(() => ({
  sections: [] as { items: UiItem[] }[],
  navigate: vi.fn(),
  run: vi.fn(async () => ({ queued: false })),
  isAllowed: true,
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: seen.navigate, dispatch: vi.fn(), goBack: vi.fn() }),
  StackActions: { replace: vi.fn() },
}));
vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}` }),
}));
vi.mock("@stackra/clients/react", () => ({
  useAction: () => ({ run: seen.run, isPending: false, isAllowed: seen.isAllowed, error: null }),
}));
vi.mock("@stackra/ui/native", () => ({
  Menu: ({ sections, children }: { sections: { items: UiItem[] }[]; children: ReactNode }) => {
    seen.sections = sections;
    return <div data-testid="menu">{children}</div>;
  },
}));

const Routes = { order_detail: routeRef("order_detail") };
const CancelOrderAction = { kind: "action", key: "orders.order.cancel@1" } as never;

interface OrderView {
  readonly id: string;
}

class OrderCardMenu extends Menu({ kind: MenuKind.Context }) {
  items(m: MenuBuilder<OrderView>) {
    return [
      m.route(Routes.order_detail, {
        label: "mobile::order_card.open",
        icon: "eye",
        params: (order) => ({ orderId: order.id }),
      }),
      m.action(CancelOrderAction, {
        label: "mobile::order_card.cancel",
        icon: "circle-x",
        destructive: true,
        input: (order) => ({ orderId: order.id }),
      }),
    ];
  }
}

/** Renders the menu bound to an order. */
async function renderMenu() {
  const container = await Container.create([]);
  render(
    <ContainerProvider container={container}>
      <ContextMenu menu={OrderCardMenu} value={{ id: "ord_1" }}>
        <button type="button">Order 1001</button>
      </ContextMenu>
    </ContainerProvider>,
  );
}

afterEach(() => {
  cleanup();
  seen.isAllowed = true;
  seen.navigate.mockClear();
  seen.run.mockClear();
});

describe("ContextMenu", () => {
  it("hands the translated entries to the menu, opened from its child", async () => {
    await renderMenu();
    expect(screen.getByRole("button", { name: "Order 1001" })).toBeTruthy();
    const items = seen.sections[0]?.items ?? [];
    expect(items.map((item) => [item.label, item.tone])).toEqual([
      ["t:mobile::order_card.open", undefined],
      ["t:mobile::order_card.cancel", "danger"],
    ]);
  });

  it("pushes the route and runs the action with what the value builds", async () => {
    await renderMenu();
    const [open, cancel] = seen.sections[0]?.items ?? [];
    open?.onPress?.();
    expect(seen.navigate).toHaveBeenCalledWith("order_detail", { orderId: "ord_1" });
    cancel?.onPress?.();
    expect(seen.run).toHaveBeenCalledWith({ orderId: "ord_1" });
  });

  it("leaves out an action the session may not run", async () => {
    seen.isAllowed = false;
    await renderMenu();
    expect(seen.sections[0]?.items.map((item) => item.label)).toEqual([
      "t:mobile::order_card.open",
    ]);
  });
});
