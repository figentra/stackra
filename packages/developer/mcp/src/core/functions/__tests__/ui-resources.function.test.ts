/**
 * Stackra file contract:
 * Purpose: unit tests of the `ui://` resource functions: `toolTable` carries a tool's resource into its descriptor
 *          `_meta`; `uiResourceTable` reads the manifests' `uiResources`, keeping the first of a URI and leaving out a
 *          malformed URI or a non-`https:` bundle; `uiResourcesFor` keeps the resources the caller's tools name; and
 *          `uiResourceContents` answers a read with the MCP Apps media type and the frame policy.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 2); STA-784.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { UI_RESOURCE_MIME_TYPE } from "#core/constants/ui-resource-mime-type.constant";
import { filterTools } from "#core/functions/filter-tools.function";
import { toolTable } from "#core/functions/tool-table.function";
import { uiResourceContents } from "#core/functions/ui-resource-contents.function";
import { uiResourceTable } from "#core/functions/ui-resource-table.function";
import { uiResourcesFor } from "#core/functions/ui-resources-for.function";

const COMMERCE: StackraManifest = {
  member: "commerce",
  package: "@figentra/service-commerce",
  version: "1.0.0",
  actions: [
    {
      key: "orders.order.get@1",
      kind: "query",
      module: "orders",
      class: "GetOrderQuery",
      permission: "orders.order.read",
      risk: "L0",
      tool: { name: "orders_order_get", ui: "ui://orders/order-card" },
    },
    {
      key: "orders.order.cancel@1",
      kind: "action",
      module: "orders",
      class: "CancelOrderAction",
      permission: "orders.order.cancel",
      risk: "L2",
      tool: { name: "orders_order_cancel", ui: "https://evil.example.com" },
    },
  ],
  uiResources: [
    {
      uri: "ui://orders/order-card",
      name: "Order card",
      url: "https://static.example.com/commerce/order-card.html",
      csp: { connectDomains: ["https://api.example.com"], resourceDomains: [] },
    },
    { uri: "ui://orders/order-card", name: "Duplicate", url: "https://other.example.com/x.html" },
    { uri: "ui://orders/refund", name: "Refund", url: "http://static.example.com/refund.html" },
    { uri: "https://orders/x", name: "Bad", url: "https://static.example.com/x.html" },
    {
      uri: "ui://orders/scanner",
      name: "Scanner",
      url: "https://static.example.com/commerce/scanner.html",
      permissions: ["camera"],
    },
  ],
};

describe("ui:// resources", () => {
  const tools = toolTable([COMMERCE]);
  const resources = uiResourceTable([COMMERCE]);

  it("carries a tool's resource into its descriptor and drops a URI that is not ui://", () => {
    expect(tools.find((tool) => tool.name === "orders_order_get")).toMatchObject({
      ui: "ui://orders/order-card",
      _meta: { ui: { resourceUri: "ui://orders/order-card" } },
    });
    const cancel = tools.find((tool) => tool.name === "orders_order_cancel");
    expect(cancel?.ui).toBeUndefined();
    // oxlint-disable-next-line no-underscore-dangle -- `_meta` is the MCP protocol field
    expect(cancel?._meta).toBeUndefined();
  });

  it("reads the resources, the first of a URI, with an https bundle only", () => {
    expect(resources.map((resource) => resource.uri)).toEqual([
      "ui://orders/order-card",
      "ui://orders/scanner",
    ]);
    expect(resources[0]).toEqual({
      uri: "ui://orders/order-card",
      name: "Order card",
      url: "https://static.example.com/commerce/order-card.html",
      member: "commerce",
      csp: { connectDomains: ["https://api.example.com"], resourceDomains: [] },
      permissions: [],
    });
  });

  it("lists only the resources the caller's tools name", () => {
    const listed = filterTools(tools, { can: () => true, isEntitled: () => true }).tools;
    expect(uiResourcesFor(resources, listed).map((resource) => resource.uri)).toEqual([
      "ui://orders/order-card",
    ]);
    const none = filterTools(tools, { can: () => false, isEntitled: () => true }).tools;
    expect(uiResourcesFor(resources, none)).toEqual([]);
  });

  it("answers a read with the bundle, the media type and the frame policy", () => {
    const [card, scanner] = resources;
    if (card === undefined || scanner === undefined) throw new Error("fixture");
    expect(uiResourceContents(card, "<html></html>")).toEqual({
      uri: "ui://orders/order-card",
      mimeType: UI_RESOURCE_MIME_TYPE,
      text: "<html></html>",
      _meta: { ui: { csp: { connectDomains: ["https://api.example.com"], resourceDomains: [] } } },
    });
    // oxlint-disable-next-line no-underscore-dangle -- `_meta` is the MCP protocol field
    expect(uiResourceContents(scanner, "")._meta).toEqual({
      ui: { csp: { connectDomains: [], resourceDomains: [] }, permissions: ["camera"] },
    });
  });
});
