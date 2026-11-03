/**
 * Stackra file contract:
 * Purpose: unit tests of `panelNavigationOf` and `documentLabel`: a panel lists the resources of its area and the
 *          documents whose route names it, grouped and ordered, each with its title key, path, icon and permission; a
 *          badge names a declared view and reads its list query for one row with the view's filter, sort and input;
 *          a resource of another area, without an entry or without a List page, and a document of another panel are
 *          left out.
 * Boundary: test only; the trees come from a stand-in `treeOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 12 and 20); build-list item 53 (STA-1981).
 */
import { ApiArea, SortDirection } from "@stackra/contracts";
import { ExperienceKind } from "@stackra/experience/contracts";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { Document } from "#core/bases/document.base";
import { Count } from "#core/enums/count.enum";
import { document } from "#core/functions/document.function";
import { documentLabel } from "#core/functions/document-label.function";
import { panelNavigationOf } from "#core/functions/panel-navigation-of.function";
import { resource } from "#core/functions/resource.function";
import type { PanelRef } from "#core/types/panel-ref.type";
import type { ResourceTree } from "#core/types/resource-tree.type";

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListOrdersQuery {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListRefundsQuery {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListMembersQuery {}

const SALES = "orders::nav.sales" as I18nKey;
const INSIGHT = "orders::nav.insight" as I18nKey;

const ADMIN: PanelRef = { key: "admin", path: "/admin", area: ApiArea.Admin };
const PORTAL: PanelRef = { key: "portal", path: "/portal", area: ApiArea.App };

const Orders = resource("orders.order", {
  base: "/orders/orders",
  list: ListOrdersQuery,
  permission: "orders.order.list",
});
const Refunds = resource("orders.refund", { base: "/orders/refunds", list: ListRefundsQuery });
const Members = resource("team.member", { base: "/team/members", list: ListMembersQuery });
const Drafts = resource("orders.draft", { base: "/orders/drafts" });
const Notes = resource("orders.note", { base: "/orders/notes", list: ListOrdersQuery });

const TREES: Readonly<Record<string, Partial<ResourceTree>>> = {
  "orders.order": {
    options: {
      area: ApiArea.Admin,
      navigation: { group: SALES, icon: "receipt", order: 20, badge: "awaiting_payment" },
      operations: { list: true },
    },
    table: {
      columns: [{ kind: "value", key: "createdAt", sortable: true }],
      filters: [{ kind: "value", key: "status" }],
      defaultSort: { key: "createdAt", direction: SortDirection.Desc },
      count: Count.Estimated,
    },
    views: [
      {
        name: "awaiting_payment",
        filter: { status: "pending" },
        input: { includeMerged: true },
      },
    ],
  },
  "orders.refund": {
    options: {
      area: ApiArea.Admin,
      navigation: { group: SALES, icon: "undo", order: 10, badge: "undeclared" },
      operations: { list: true },
    },
  },
  "team.member": {
    options: {
      area: ApiArea.App,
      navigation: { group: SALES, icon: "users", order: 1 },
      operations: { list: true },
    },
  },
  "orders.draft": {
    options: {
      area: ApiArea.Admin,
      navigation: { group: SALES, icon: "file", order: 5 },
      operations: {},
    },
  },
  "orders.note": { options: { area: ApiArea.Admin, operations: { list: true } } },
};

const treeOf = (key: string): Partial<ResourceTree> => TREES[key] ?? {};

class SalesOverviewDocument extends Document({
  kind: ExperienceKind.Dashboard,
  path: "/sales",
  navigation: { group: INSIGHT, icon: "layout-dashboard", order: 1 },
  blocks: [],
}) {}

class HiddenDocument extends Document({
  kind: ExperienceKind.Page,
  path: "/hidden",
  blocks: [],
}) {}

const DOCUMENTS = [
  {
    route: document("orders.sales_overview", {
      path: "/sales",
      panel: ADMIN,
      permission: "orders.order.kpis",
    }),
    document: SalesOverviewDocument,
  },
  { route: document("orders.hidden", { path: "/hidden", panel: ADMIN }), document: HiddenDocument },
  {
    route: document("orders.portal_sales", { path: "/sales", panel: PORTAL }),
    document: SalesOverviewDocument,
  },
];

describe("panelNavigationOf", () => {
  it("groups the panel's resources and documents in order, with their badges", () => {
    const groups = panelNavigationOf(
      ADMIN,
      [Orders, Refunds, Members, Drafts, Notes],
      DOCUMENTS,
      treeOf,
    );
    expect(groups).toEqual([
      {
        group: INSIGHT,
        entries: [
          {
            key: "orders.sales_overview",
            label: "orders::documents.sales_overview.title",
            href: "/admin/sales",
            icon: "layout-dashboard",
            order: 1,
            permission: "orders.order.kpis",
          },
        ],
      },
      {
        group: SALES,
        entries: [
          {
            key: "orders.refund",
            label: "orders::resources.refund.title",
            href: "/orders/refunds",
            icon: "undo",
            order: 10,
          },
          {
            key: "orders.order",
            label: "orders::resources.order.title",
            href: "/orders/orders",
            icon: "receipt",
            order: 20,
            permission: "orders.order.list",
            badge: {
              query: ListOrdersQuery,
              input: {
                includeMerged: true,
                limit: 1,
                sort: { key: "createdAt", direction: SortDirection.Desc },
                filter: { status: "pending" },
              },
            },
          },
        ],
      },
    ]);
  });

  it("lists another panel's own entries only", () => {
    const groups = panelNavigationOf(PORTAL, [Orders, Members], DOCUMENTS, treeOf);
    expect(groups.flatMap((group) => group.entries.map((entry) => entry.key))).toEqual([
      "orders.portal_sales",
      "team.member",
    ]);
  });
});

describe("documentLabel", () => {
  it("derives a document's label key from its key", () => {
    expect(documentLabel("orders.sales_overview", "title")).toBe(
      "orders::documents.sales_overview.title",
    );
  });
});
