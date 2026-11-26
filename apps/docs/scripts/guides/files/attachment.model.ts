/**
 * Stackra file contract:
 * Purpose: `Attachment`, the example model of the "Files" guide: one claimed file, one row of `support.attachments`
 *          (key `support.attachment`, public ids `att_…`), owned by a tenant. The bytes stay on the disk; the row keeps
 *          where they are, so the tenant policy decides who may ask for a link.
 * Boundary: data only, as an app's `src/modules/support/models/attachment.model.ts` would hold it.
 * Runtime: node
 * Governing contract: ADR 0222; ADR 0239 (tenant isolation); ADR 0294; STA-2843.
 */
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Int, Str } from "@stackra/validation";

/** A file attached to a ticket. */
export class Attachment extends Model.with(HasPublicId("att"), BelongsToTenant, Timestamps) {
  /** The file's name as the customer gave it. */
  @Str({ max: 200 })
  name!: string;

  /** Where the claim stored it on the disk (`private/support/ticket_attachments/upl_….pdf`). */
  @Str({ max: 300 })
  path!: string;

  /** Its media type (`application/pdf`). */
  @Str({ max: 100 })
  mediaType!: string;

  /** Its size in bytes. */
  @Int({ min: 1 })
  size!: number;
}
