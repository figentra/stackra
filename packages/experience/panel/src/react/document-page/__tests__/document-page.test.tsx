/**
 * Stackra file contract:
 * Purpose: unit tests of `DocumentPage`: the title from the document key; a Dashboard's registered widget tiles at their
 *          block size under the dashboard's range; a Page's query table with its columns and its registered block drawn
 *          through experience's renderer under its key; an unregistered widget or block skipped; a class that is not a
 *          document refused.
 * Boundary: unit tier, jsdom with the real @stackra/ui `PageHeader` and `Select`; the tile, the resource table and the
 *           experience renderer are recording stand-ins, translation returns the key.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 20); build-list item 53 (STA-1981).
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import { ExperienceKind } from "@stackra/experience/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Document } from "#core/bases/document.base";
import { Blocks } from "#core/constants/blocks.constant";
import { TimeRange } from "#core/enums/time-range.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { document } from "#core/functions/document.function";
import { registerWidgets } from "#core/functions/register-widgets.function";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";
import { DocumentPage } from "#react/document-page/document-page";

const drawn = vi.hoisted(() => ({
  tiles: [] as { readonly key: string; readonly size: string; readonly range: unknown }[],
  tables: [] as { readonly resourceKey: string; readonly columns: readonly string[] }[],
  blocks: [] as unknown[],
}));

vi.mock("@stackra/i18n/react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("#react/widget-tile/widget-tile", () => ({
  WidgetTile: (props: { readonly widget: WidgetDescriptor; readonly range?: unknown }) => {
    drawn.tiles.push({ key: props.widget.key, size: props.widget.size, range: props.range });
    return null;
  },
}));
vi.mock("#react/resource-pages/resource-table", () => ({
  ResourceTable: (props: {
    readonly resourceKey: string;
    readonly table: { readonly columns: readonly { readonly key: string }[] };
  }) => {
    drawn.tables.push({
      resourceKey: props.resourceKey,
      columns: props.table.columns.map((column) => column.key),
    });
    return null;
  },
}));
vi.mock("@stackra/experience/react", () => ({
  DocumentRenderer: (props: { readonly document: unknown }) => {
    drawn.blocks.push(props.document);
    return null;
  },
}));
vi.mock("@stackra/experience", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  registeredBlocks: () => new Map([["web.welcome_hero", WelcomeHeroBlock]]),
}));

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: stand-in widget classes, read by identity only
class OrderKpisWidget {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: stand-in widget classes, read by identity only
class MissingWidget {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in block class, read by identity only
class WelcomeHeroBlock {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in block class, read by identity only
class MissingBlock {}
const ListOrdersQuery = Object.assign(
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref with its key
  class {},
  { key: "orders.order.list@1" },
);

const ADMIN = { key: "admin", path: "/admin", area: ApiArea.Admin };

class SalesDashboard extends Document({
  kind: ExperienceKind.Dashboard,
  path: "/sales",
  range: { ranges: [TimeRange.Today, TimeRange.Last7Days], default: TimeRange.Last7Days },
  blocks: [Blocks.widget(OrderKpisWidget, { size: WidgetSize.Full }), Blocks.widget(MissingWidget)],
}) {}

class WelcomePage extends Document({
  kind: ExperienceKind.Page,
  path: "/welcome",
  blocks: [
    Blocks.custom(WelcomeHeroBlock, { titleKey: "orders::documents.welcome.hero" }),
    Blocks.custom(MissingBlock, {}),
    Blocks.table(ListOrdersQuery, { columns: ["id", "status"] }),
  ],
}) {}

afterEach(() => {
  cleanup();
  drawn.tiles.length = 0;
  drawn.tables.length = 0;
  drawn.blocks.length = 0;
});

describe("DocumentPage", () => {
  it("draws a dashboard's registered tiles at their block size under its range", () => {
    registerWidgets([
      { key: "orders.order_kpis", widget: OrderKpisWidget, size: WidgetSize.Small },
    ] as unknown as WidgetDescriptor[]);
    render(
      <DocumentPage
        document={SalesDashboard}
        route={document("orders.sales", { path: "/sales", panel: ADMIN })}
      />,
    );
    expect(screen.getByRole("heading", { name: "orders::documents.sales.title" })).toBeTruthy();
    expect(drawn.tiles).toEqual([
      { key: "orders.order_kpis", size: WidgetSize.Full, range: TimeRange.Last7Days },
    ]);
    registerWidgets([]);
  });

  it("draws a page's registered blocks and query tables", () => {
    render(
      <DocumentPage
        document={WelcomePage}
        route={document("orders.welcome", { path: "/welcome", panel: ADMIN })}
      />,
    );
    expect(drawn.blocks).toEqual([
      { block: "web.welcome_hero", props: { titleKey: "orders::documents.welcome.hero" } },
    ]);
    expect(drawn.tables).toEqual([{ resourceKey: "orders.order", columns: ["id", "status"] }]);
  });

  it("refuses a class that is not a document", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a class of no kind
    class NotADocument {}
    expect(() =>
      render(
        <DocumentPage
          document={NotADocument}
          route={document("orders.none", { path: "/none", panel: ADMIN })}
        />,
      ),
    ).toThrow(TypeError);
  });
});
