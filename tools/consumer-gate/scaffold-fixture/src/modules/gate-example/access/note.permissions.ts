/**
 * Stackra file contract:
 * Purpose: `NotePermissions`, the permissions of the consumer-gate scaffold fixture's note: `gate_example.note.add`.
 * Boundary: statics only; the value is the risk. The key comes from the module, the class (minus `Permissions`) and
 *           the static, so `AddGateNoteAction` (`note.add`) finds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (the v3 shape); ADR 0208 (names); ADR 0099 (risk); STA-2705.
 */
import { Permission, Permissions } from "@stackra/iam";

/** Written by `AddGateNoteAction`. */
export class NotePermissions extends Permissions {
  /** Add a note: a write, so at least L2. */
  static readonly add = Permission.L2;
}
