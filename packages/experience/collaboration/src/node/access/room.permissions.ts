/**
 * Stackra file contract:
 * Purpose: `RoomPermissions`, the permissions of a collaboration room: `collaboration.room.<verb>`, each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. `RoomTokenAction` reads `token` and `RoomPublishAction` reads `publish` by
 *           their keys; the token action also checks the document's own view and edit permissions, and the room
 *           re-checks the member's edit right, size and rate caps per message (ADR 0346 decisions 3 and 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0346 (decision 5); ADR 0099 (risk).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `RoomPermissions.publish` by the room actions.
 *
 * @example
 * export class RoomPublishAction extends Action({ key: "room.publish", ... }) {}
 */
export class RoomPermissions extends Permissions {
  /**
   * Ask for a one-time room token; a write (it mints a credential), and the document's own view permission is checked
   * on the record as well.
   */
  static readonly token = Permission.L2;

  /** Relay a message into a room as one of its members; a write, but the room token already gated who joins. */
  static readonly publish = Permission.L2;
}
