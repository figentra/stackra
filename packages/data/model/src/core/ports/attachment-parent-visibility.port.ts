/**
 * Stackra file contract:
 * Purpose: `AttachmentParentVisibility`, the port the files service asks "can this actor view the record this file
 *          is attached to" before it serves an attachment of a `HasAttachments` model: a file is visible only to
 *          whoever can see its parent record.
 * Boundary: an abstract class that is its own token, key `model.AttachmentParentVisibility`. It is bound in the files
 *           service's process, which calls it through `canViewAttachment` after it has checked the file's tenant and
 *           scope itself. Its answer is the parent model's owning service's (row-level security, scope and
 *           visibility rules, exactly as a read of the record would decide), so a binding routes each
 *           `parent.model` to that service and refuses a model it cannot route. That routing driver and gen's
 *           canView contract query per `HasAttachments` model are not built yet (STA-2833). A driver answers
 *           `false` for a record that does not exist, so a refusal and a missing parent look the same.
 *           `AttachmentVisibilityCache` keeps its answers briefly for the files service. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (files); ADR 0333 (2026-10-24 amendment: a record under a related record is visible
 *                     only when that record is); ADR 0294 (decisions 16 and 17); STA-1960.
 */
import { Port } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

import type { AttachmentParent } from "#core/types/attachment-parent.type";

/**
 * Answers whether an actor can view an attachment's parent record.
 *
 * @example
 * // bound in the files service; a parent model it cannot route refuses
 * export class ParentVisibilityDriver extends Driver(AttachmentParentVisibility) {
 *   async canView(parent: AttachmentParent, actor: Actor) {
 *     const owner = this.owners.get(parent.model);
 *     return owner !== undefined && (await owner.canView(parent, actor));
 *   }
 * }
 */
export abstract class AttachmentParentVisibility extends Port {
  /** Type-only port key, so `DriverName<AttachmentParentVisibility>` narrows to this port's drivers. */
  declare readonly "~key": "model.AttachmentParentVisibility";

  /**
   * Whether `actor` can view `parent` now.
   *
   * @param parent - the record the file is attached to, from the file row.
   * @param actor - the verified caller, with the delegation chain behind it.
   * @returns true only when the actor can read the parent record; false when it cannot or the record does not exist.
   */
  abstract canView(parent: AttachmentParent, actor: Actor): Promise<boolean>;
}
