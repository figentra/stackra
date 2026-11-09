/**
 * Stackra file contract:
 * Purpose: `CollaborationModule`, the root module of @stackra/collaboration's server side: a host that declares the
 *          package imports it, so the room actions (`collaboration.room.token`, `collaboration.room.publish`) and the
 *          room endpoint (`RoomController` at `REALTIME_ROOM_PATH`) are bound and served with no hand wiring.
 * Boundary: exports `CommentService`, the one service a host's own code injects; everything else in src/node is
 *           discovered from its path and base class. Written so the manifest names its file, which is what lets a
 *           host's generated wiring import the module and bind its actions and controllers.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 12, 15 and 16); ADR 0305 (an optional root module); ADR 0346 (decision 5).
 */
import { Module } from "@stackra/container";

import { CommentService } from "#node/services/comment.service";

/** Imported once by a host. */
export class CollaborationModule extends Module({ exports: [CommentService] }) {}
