/**
 * Stackra file contract:
 * Purpose: `AttachmentParent`, the record an attached file belongs to, named by its model key and public id: what the
 *          files service hands `AttachmentParentVisibility` before it serves an attachment.
 * Boundary: a type only. The model key is gen's `modelKey`, `<module>.<snake(Class)>` (ADR 0294 decision 20), of a
 *           model composed with `HasAttachments`; the id is the parent's public id as the file row stores it. Neither
 *           is ever read from a request: the files service takes both from its own file row.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (files); ADR 0333 (2026-10-24 amendment: a record under a related record is visible
 *                     only when that record is); ADR 0135 (public ids); STA-1960.
 */
import type { PublicId } from "@stackra/contracts";

/**
 * The parent record of an attachment.
 *
 * @example
 * const parent: AttachmentParent = { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w3" };
 */
export interface AttachmentParent {
  /** The parent model's key, `<module>.<model>` in snake case (`legal.matter`, `finance.expense_claim`). */
  readonly model: string;
  /** The parent record's public id. */
  readonly id: PublicId;
}
