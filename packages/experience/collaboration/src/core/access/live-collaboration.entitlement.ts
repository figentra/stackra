/**
 * Stackra file contract:
 * Purpose: `LiveCollaborationEntitlement`, the plan right this package contributes: presence, cursors and co-editing
 *          in a room. The code is free; the right is granted by the plan or the licence (ADR 0270 decision 5, ADR 0202).
 * Boundary: a feature entitlement (granted `true` or not), so it counts no model. `CollaborationSession` reads its
 *           grant for the room's scope before joining; gen registers it to gate the server's collaboration calls. It
 *           never gates editing or snapshots: without it a document still opens, restores and saves, alone.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 5); ADR 0202 (free code, app entitlement); ADR 0215 (decision 1: feature
 *                     entitlements); ADR 0294 (decision 20: key `collaboration.live_collaboration` derived).
 */
import { Entitlement, EntitlementKind } from "@stackra/entitlements";

/** Live collaboration: presence, cursors and co-editing. */
export class LiveCollaborationEntitlement extends Entitlement({ kind: EntitlementKind.Feature }) {}
