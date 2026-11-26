/**
 * Stackra file contract:
 * Purpose: the stand-in for what `stackra gen` writes for the guide's attachments in an app: the `Attachment` entity
 *          metadata (`.stackra/gen/entities/support.ts`, in gen's shape), the bucket's key (`registerBuckets`) and the
 *          `AttachmentService` partner registration (the generated test setup).
 * Boundary: test support only; loading it registers the entity, the bucket key and the partner.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0305; ADR 0222; STA-2843.
 */
import {
  EntitySchema,
  type OptionalProps,
  registerEntities,
  registerModelPartners,
} from "@stackra/database";
import { registerBuckets } from "@stackra/media";

import { Attachment } from "../attachment.model";
import { AttachmentService } from "../attachment.service";
import { TicketAttachmentsBucket } from "../ticket-attachments.bucket";

declare module "../attachment.model" {
  interface Attachment {
    [OptionalProps]?: "createdAt" | "id" | "tenantId" | "updatedAt";
  }
}

/** `support.attachment` (attachment.model.ts). */
export const AttachmentSchema = new EntitySchema<Attachment>({
  class: Attachment,
  schema: "support",
  tableName: "attachments",
  properties: {
    name: { type: "string" },
    path: { type: "string" },
    mediaType: { type: "string" },
    size: { type: "integer" },
    id: { type: "string", primary: true },
    tenantId: { type: "string" },
    createdAt: { type: "datetime" },
    updatedAt: { type: "datetime", onUpdate: () => new Date() },
  },
});

registerEntities([AttachmentSchema]);
registerBuckets([{ type: TicketAttachmentsBucket, key: "support.ticket_attachments" }]);
registerModelPartners([[AttachmentService, Attachment]]);
