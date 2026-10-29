/**
 * Stackra file contract:
 * Purpose: `ScopeMoved`, a scope node and its subtree moved under another parent. Leaves through the host's outbox as
 *          `scope.node.moved.v1`, so every service re-paths its own `scope_path` rows.
 * Boundary: an integration event recorded on the moved node by `ScopeNodeService.moveSubtree`, written in the move's
 *           transaction. It carries the node's id and its old and new paths, nothing else: each service's listener
 *           calls `repath(from, to)` on its `CrudService` (@stackra/database) in a scope that reaches both paths. It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0411 (subtree move); ADR 0327 (decision 3); ADR 0294 (decisions 16 and 20); ADR 0141; ADR
 *                     0305 (rule 19).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * The node keeps its id; only its path, and the paths below it, change.
 *
 * @example
 * node.record(ScopeMoved.create({ scopeId: node.id, from: "platform.a.shop", to: "platform.b.shop" }));
 */
export class ScopeMoved extends IntegrationEvent({ name: "node.moved" }) {
  /** The node that moved. */
  scopeId!: PublicId<"scp">;

  /** Its path before the move; every path at or below it moves. */
  from!: string;

  /** Its path after the move, under the new parent. */
  to!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [ScopeMoved, z.object({ scopeId: publicId("scp"), from: z.string(), to: z.string() })],
]);
