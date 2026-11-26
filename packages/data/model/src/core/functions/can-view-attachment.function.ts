/**
 * Stackra file contract:
 * Purpose: `canViewAttachment`, the one check the files service runs before it serves an attachment of a
 *          `HasAttachments` model: the file is served only when `AttachmentParentVisibility` says the actor can view
 *          the parent record.
 * Boundary: fails closed: with no `AttachmentParentVisibility` bound it answers false, and only a literal `true` from
 *           the driver counts. A malformed parent reference is a bug in the caller's file row, so it throws rather
 *           than answering. A driver's error propagates, so nothing is served on doubt. With an
 *           `AttachmentVisibilityCache` the answer is reused briefly per parent and actor. Tenant and scope are the
 *           files service's own checks, run before this one; this function never replaces them. The caller answers a
 *           refusal as "not found", so a hidden parent and a missing file look the same. No files service calls it
 *           yet, and the files-side driver that routes a parent's model key to its owning service is not built:
 *           both are STA-2833.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (files); ADR 0333 (2026-10-24 amendment: a record under a related record is visible
 *                     only when that record is); STA-1960.
 */
import { isPublicId } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

import type { AttachmentParentVisibility } from "#core/ports/attachment-parent-visibility.port";
import type { AttachmentParent } from "#core/types/attachment-parent.type";
import type { AttachmentVisibilityCache } from "#core/values/attachment-visibility-cache.value";

/** A model key: `<module>.<model>`, both snake case (ADR 0294 decision 20). */
const MODEL_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Whether `actor` may be served a file attached to `parent`.
 *
 * @param visibility - the bound `AttachmentParentVisibility`, or undefined when the host binds none.
 * @param parent - the record the file is attached to, read from the file row (never from the request).
 * @param actor - the verified caller.
 * @param cache - an optional short cache of answers, kept by the files service.
 * @returns true only when a bound driver answers `true`.
 * @throws TypeError when `parent` has no model key of the form `<module>.<model>`, or its id is not a public id.
 * @example
 * if (!(await canViewAttachment(this.parents, file.parent, ctx.actor, this.cache)))
 *   throw FileNotFoundError.create({ id });
 */
export async function canViewAttachment(
  visibility: AttachmentParentVisibility | undefined,
  parent: AttachmentParent,
  actor: Actor,
  cache?: AttachmentVisibilityCache,
): Promise<boolean> {
  if (typeof parent.model !== "string" || !MODEL_KEY.test(parent.model))
    throw new TypeError(
      `An attachment's parent names its model as <module>.<model>, got "${String(parent.model)}"`,
    );
  const [prefix = ""] = String(parent.id).split("_", 1);
  if (!isPublicId(parent.id, prefix))
    throw new TypeError(`An attachment's parent ${parent.model} has no public id`);
  if (visibility === undefined) return false;
  const ask = async (): Promise<boolean> => (await visibility.canView(parent, actor)) === true;
  return cache === undefined ? ask() : cache.answer(parent, actor, ask);
}
