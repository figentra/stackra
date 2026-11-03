/**
 * Stackra file contract:
 * Purpose: unit tests of `usePanelNavigation`: the current panel's groups as navigation items with translated labels,
 *          links and icons, the entry the viewer is below marked current, an entry without its permission left out,
 *          and a badge filled from its view's count (capped as `N+`), none when the read fails.
 * Boundary: unit tier, jsdom, in a memory router under the panel context; the permission check, the query client and
 *           translation are stand-ins.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 12); ADR 0214; build-list item 53 (STA-1981).
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { NavigationItem } from "@stackra/ui/contracts";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

import { registerResources } from "#core/functions/register-resources.function";
import { resource } from "#core/functions/resource.function";
import type { ResourceTree } from "#core/types/resource-tree.type";
import { usePanelNavigation } from "#react/panel-navigation/use-panel-navigation";
import { PanelContext } from "#react/panel-shell/panel-context";
import { registerPanelPages } from "#react/route-pages/register-panel-pages.function";

const spies = vi.hoisted(() => ({
  can: vi.fn((permission?: string) => permission !== "orders.secret.list"),
  fetch: vi.fn(),
}));

vi.mock("#react/action-runner/use-can", () => ({ useCan: () => spies.can }));
vi.mock("@stackra/clients/react", () => ({ useQueryClient: () => ({ fetch: spies.fetch }) }));
vi.mock("@stackra/i18n/react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListOrdersQuery {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListRefundsQuery {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListSecretsQuery {}

const SALES = "orders::nav.sales" as I18nKey;

const tree = (icon: string, order: number, badge?: string) => ({
  options: {
    area: ApiArea.Admin,
    navigation: { group: SALES, icon, order, ...(badge === undefined ? {} : { badge }) },
    operations: { list: true },
  },
  views: [{ name: "open", filter: {} }],
});

const TREES = {
  "orders.order": tree("receipt", 1, "open"),
  "orders.refund": tree("undo", 2, "open"),
  "orders.secret": tree("lock", 3),
} as unknown as Readonly<Record<string, ResourceTree>>;

const RESOURCES = [
  resource("orders.order", { base: "/orders/orders", list: ListOrdersQuery }),
  resource("orders.refund", { base: "/orders/refunds", list: ListRefundsQuery }),
  resource("orders.secret", {
    base: "/orders/secrets",
    list: ListSecretsQuery,
    permission: "orders.secret.list",
  }),
];

/** Prints the hook's items. */
function Probe() {
  const items = usePanelNavigation();
  return <pre>{JSON.stringify(items)}</pre>;
}

/** The items printed last. */
const printed = (): readonly NavigationItem[] =>
  JSON.parse(screen.getByText(/^\[/).textContent ?? "[]") as NavigationItem[];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("usePanelNavigation", () => {
  it("draws the panel's groups with links, the current entry and the badges", async () => {
    spies.fetch.mockImplementation((query: unknown) =>
      query === ListOrdersQuery
        ? Promise.resolve({ items: [], count: { value: 10_000, capped: true } })
        : Promise.reject(new Error("offline")),
    );
    const trees = registerResources(TREES);
    const dispose = registerPanelPages({ resources: RESOURCES });
    render(
      <MemoryRouter initialEntries={["/orders/orders/ord_1"]}>
        <PanelContext value={{ panel: { key: "admin", path: "/", area: ApiArea.Admin } }}>
          <Probe />
        </PanelContext>
      </MemoryRouter>,
    );
    await waitFor(() => expect(printed()[0]?.children?.[0]?.badge).toBe("10000+"));
    expect(printed()).toEqual([
      {
        id: SALES,
        label: SALES,
        children: [
          {
            id: "orders.order",
            label: "orders::resources.order.title",
            href: "/orders/orders",
            icon: "receipt",
            isCurrent: true,
            badge: "10000+",
          },
          {
            id: "orders.refund",
            label: "orders::resources.refund.title",
            href: "/orders/refunds",
            icon: "undo",
            isCurrent: false,
          },
        ],
      },
    ]);
    expect(spies.fetch).toHaveBeenCalledWith(ListOrdersQuery, { limit: 1 });
    dispose();
    trees();
  });
});
