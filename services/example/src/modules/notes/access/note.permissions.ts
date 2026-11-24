/**
 * Stackra file contract:
 * Purpose: `NotePermissions`, the permissions of the note model: `notes.note.<verb>`, each with its risk.
 * Boundary: statics only; the value is the risk. Keys and labels are derived from the module, the class (minus
 *           `Permissions`) and the static: `note.get` and `note.list` take `read`, `note.create` and `note.update` take
 *           their own, and `note.delete` is the one irreversible verb.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0208 (names); ADR 0099 (risk).
 */
import { Permission, Permissions } from "@stackra/iam";

/** Read by the note actions and queries. */
export class NotePermissions extends Permissions {
  /** Read notes, one or a page. */
  static readonly read = Permission.L0;

  /** Add a note. */
  static readonly create = Permission.L2;

  /** Change a note's title or text. */
  static readonly update = Permission.L2;

  /** Delete a note for good. */
  static readonly delete = Permission.L2;
}
