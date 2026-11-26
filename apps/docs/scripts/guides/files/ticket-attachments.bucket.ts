/**
 * Stackra file contract:
 * Purpose: `TicketAttachmentsBucket`, the example bucket of the "Files" guide: private files a customer attaches to a
 *          support ticket (key `support.ticket_attachments`), PDFs and photos up to 10 MB.
 * Boundary: data only, as an app's `src/modules/support/models/ticket-attachments.bucket.ts` would hold it; gen derives
 *           the key from the file. Private: the CDN never serves it; a reader gets a time-limited link.
 * Runtime: node
 * Governing contract: ADR 0222 (the bucket kind and the upload flow); ADR 0465 (one object-storage port); STA-2843.
 */
import { Bucket, BucketVisibility, MediaType } from "@stackra/media";

/** What a customer may attach to a ticket. */
export class TicketAttachmentsBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 10_000_000,
  accept: [MediaType.Pdf, MediaType.Png, MediaType.Jpeg],
}) {}
