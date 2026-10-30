/**
 * Stackra file contract:
 * Purpose: `offerClientTools(table, surface, held)`, the client tools a session's surface may be offered: those of the
 *          app's table the caller holds the permission for, and none unless the surface is a screen holding the same
 *          table as the server.
 * Boundary: pure. A surface with no screen (an MCP host, WhatsApp, a background run) gets no client tool; a surface
 *           whose table hash differs from the server's gets none either, since its handlers may not match (ADR 0490
 *           decision 3). A row with no permission is offered to anyone on the screen. Offering is a filter, never a grant:
 *           a client tool changes only the viewer's screen (decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 2 and 3); STA-1631.
 */
import { SurfaceKind } from "#contracts/enums/surface-kind.enum";
import type { ClientToolRow } from "#contracts/types/client-tool-row.type";
import type { ClientToolTable } from "#contracts/types/client-tool-table.type";
import type { SurfaceDescriptor } from "#contracts/types/surface-descriptor.type";

/**
 * The client tools to offer the model for `surface`.
 *
 * @param table - the app's client tool table the server holds.
 * @param surface - what the session's surface said about itself.
 * @param held - the permissions the caller holds.
 * @example
 * offerClientTools(table, { id: "srf_1", kind: SurfaceKind.Screen, app: "console", hash: table.hash, route: "home", locale: "en-US" }, ["orders.order.read"]);
 */
export function offerClientTools(
  table: ClientToolTable,
  surface: SurfaceDescriptor,
  held: Iterable<string>,
): readonly ClientToolRow[] {
  if (surface.kind !== SurfaceKind.Screen) return [];
  if (surface.app !== table.app || surface.hash !== table.hash) return [];
  const permissions = new Set(held);
  return table.tools.filter(
    (row) => row.permission === undefined || permissions.has(row.permission),
  );
}
