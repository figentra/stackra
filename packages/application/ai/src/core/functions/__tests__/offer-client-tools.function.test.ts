/**
 * Stackra file contract:
 * Purpose: unit tests of `offerClientTools`: a screen holding the server's table gets the rows its permissions allow,
 *          and an MCP host, a messaging channel, a background run, a stale hash or another app gets none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decision 3); STA-1631.
 */
import { describe, expect, it } from "@stackra/testing";

import { ClientToolKind } from "#contracts/enums/client-tool-kind.enum";
import { SurfaceKind } from "#contracts/enums/surface-kind.enum";
import type { ClientToolRow } from "#contracts/types/client-tool-row.type";
import type { ClientToolTable } from "#contracts/types/client-tool-table.type";
import type { SurfaceDescriptor } from "#contracts/types/surface-descriptor.type";
import { offerClientTools } from "#core/functions/offer-client-tools.function";

const row = (key: string, permission?: string): ClientToolRow => ({
  key,
  name: key.replaceAll(".", "_"),
  from: "client",
  risk: "L0",
  kind: ClientToolKind.Filter,
  target: "orders.order",
  module: "orders",
  ...(permission === undefined ? {} : { permission }),
  inputSchema: { type: "object" },
});
const table: ClientToolTable = {
  app: "console",
  hash: "h1",
  tools: [row("ui.point"), row("orders.order.list.filter", "orders.order.read")],
};
const screen: SurfaceDescriptor = {
  id: "srf_1",
  kind: SurfaceKind.Screen,
  app: "console",
  hash: "h1",
  route: "orders",
  locale: "en-US",
};

describe(offerClientTools, () => {
  it("offers a screen the rows its permissions allow", () => {
    expect(offerClientTools(table, screen, []).map((each) => each.key)).toEqual(["ui.point"]);
    expect(offerClientTools(table, screen, ["orders.order.read"]).map((each) => each.key)).toEqual([
      "ui.point",
      "orders.order.list.filter",
    ]);
  });

  it("offers nothing to a surface with no screen", () => {
    for (const kind of [SurfaceKind.McpHost, SurfaceKind.Messaging, SurfaceKind.Background])
      expect(offerClientTools(table, { ...screen, kind }, ["orders.order.read"])).toEqual([]);
  });

  it("offers nothing on a table hash mismatch or another app", () => {
    expect(offerClientTools(table, { ...screen, hash: "old" }, ["orders.order.read"])).toEqual([]);
    expect(offerClientTools(table, { ...screen, app: "mobile" }, ["orders.order.read"])).toEqual(
      [],
    );
  });
});
