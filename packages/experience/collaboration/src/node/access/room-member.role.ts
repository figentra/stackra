/**
 * Stackra file contract:
 * Purpose: `RoomMemberRole`, the module role of a live collaborator (`collaboration.room_member`): it grants
 *          `collaboration.room.token` and `collaboration.room.publish`, the two L2 permissions a member needs to join a
 *          document room and, on the event-stream fallback, to send through it.
 * Boundary: a shipped, read-only role. It opens no document by itself: the token action still checks the model's own
 *           view permission on the record, and the edit permission decides `mayEdit`. A scope assigns it beside the
 *           roles that hold those model permissions; a custom role may list the two keys instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 2: module roles); ADR 0346 (decisions 3 and 5); ADR 0294 (decision 16).
 */
import { Role } from "@stackra/iam";

import { RoomPermissions } from "#node/access/room.permissions";

/**
 * Joins collaboration rooms.
 *
 * @example
 * // a scope grants it beside the role that holds TemplatePermissions.read / .update
 */
export class RoomMemberRole extends Role({
  grants: [RoomPermissions.token, RoomPermissions.publish],
}) {}
