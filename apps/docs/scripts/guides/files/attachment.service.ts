/**
 * Stackra file contract:
 * Purpose: `AttachmentService`, the example service of the "Files" guide: it claims a finished upload into the
 *          private ticket-attachments bucket and records it for the running tenant, and hands out a five-minute link
 *          to a file only after reading its row, so another tenant's id is `not_found`.
 * Boundary: the bytes never pass through it (the client put them to a signed URL); runs inside the caller's tenant call.
 *           `MediaLibrary` claims, the `FileSystem` port links; neither is a driver.
 * Runtime: node
 * Governing contract: ADR 0222 (decisions 1 to 3); ADR 0465; ADR 0239; ADR 0105 as amended by ADR 0294; STA-2843.
 */
import { Duration } from "@stackra/contracts";
import { CrudService } from "@stackra/database";
import type { FileSystem } from "@stackra/filesystem/contracts";
import type { MediaLibrary, Upload } from "@stackra/media";

import type { Attachment } from "./attachment.model";
import { TicketAttachmentsBucket } from "./ticket-attachments.bucket";

/** How long a link to an attachment works. */
const LINK_LIFETIME = Duration.minutes(5);

/** The attachments of the support module. */
export class AttachmentService extends CrudService<Attachment> {
  /** Claims uploads into the bucket. */
  private readonly media: MediaLibrary;

  /** The disk the files are on. */
  private readonly files: FileSystem;

  /**
   * @param media - claims a finished upload.
   * @param files - signs a link to a stored file.
   */
  constructor(media: MediaLibrary, files: FileSystem) {
    super();
    this.media = media;
    this.files = files;
  }

  /** Claims `upload` for the ticket-attachments bucket and records it for the running tenant. */
  async attach(upload: Upload<TicketAttachmentsBucket>, name: string): Promise<Attachment> {
    const file = await this.media.claim(upload, TicketAttachmentsBucket);
    return this.insert({ name, path: file.path, mediaType: file.mediaType, size: file.size });
  }

  /** A link to the attachment that works for five minutes; reading the row first keeps it to its tenant. */
  async link(id: Attachment["id"]): Promise<string> {
    const attachment = await this.findOneOrFail({ id });
    return this.files.temporaryUrl(attachment.path, LINK_LIFETIME);
  }
}
