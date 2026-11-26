/**
 * Stackra file contract:
 * Purpose: the tests of the "Files" guide's examples on PGlite and the memory disk: an upload goes through
 *          `createUpload` and a signed `PUT` as a browser's would; `attach` claims it into the private bucket and records
 *          it for the tenant; `link` gives that tenant a five-minute link and another tenant `not_found`; the bucket
 *          refuses a type it does not take and a file over its size; and a token claims once.
 * Boundary: test only; the database is the memory driver started from the compiled migration (run as a role without
 *           BYPASSRLS), the disk is `MemoryFileSystemDriver` (the `memory` disk, which signs and receives uploads as the
 *           cloud disks do), and `attachments.entities.ts` stands in for gen's output.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0222; ADR 0465; ADR 0239; STA-2843.
 */
import "./attachments.entities";

import { buildConfig } from "@stackra/config";
import { SystemClockDriver } from "@stackra/container";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import {
  MediaConfig,
  MediaLibrary,
  MediaType,
  UploadIncompleteError,
  UploadRejectedError,
} from "@stackra/media";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { asTenant, fakeTenantId } from "@stackra/tenancy/testing";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { connectGuideDatabase } from "#scripts/guides/support/connect-guide-database";
import type { GuideDatabase } from "#scripts/guides/support/guide-database";
import { asServiceRole } from "#scripts/guides/support/as-service-role";
import { createServiceRole } from "#scripts/guides/support/create-service-role";
import { CreateAttachmentsMigration } from "../0001-create-attachments.migration";
import { AttachmentService } from "../attachment.service";
import { TicketAttachmentsBucket } from "../ticket-attachments.bucket";

/** The first bytes of a real PDF, which the claim's content check reads. */
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

let guide: GuideDatabase;

beforeAll(async () => {
  guide = await connectGuideDatabase([
    { schema: "support", migrations: [CreateAttachmentsMigration], macros: [BelongsToTenantMacro] },
  ]);
  await createServiceRole("support");
}, 120_000);

afterAll(async () => {
  await guide.close();
});

/** The memory disk serving from `https://files.test`, the media library over it and the service. */
function setup() {
  // #region setup
  const clock = new SystemClockDriver();
  const disk = new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://files.test" } }),
    clock,
  );
  const media = new MediaLibrary(disk, buildConfig(MediaConfig), clock);
  const attachments = new AttachmentService(media, disk);
  // #endregion setup
  return { disk, media, attachments };
}

describe("Files guide", { timeout: 60_000 }, () => {
  it("claims an upload for a tenant and links it for that tenant only", async () => {
    const { disk, media, attachments } = setup();
    const acme = fakeTenantId();
    const globex = fakeTenantId();

    // #region upload
    // The browser's part: ask for a signed upload, then put the bytes to its URL.
    const pending = await media.createUpload(TicketAttachmentsBucket, {
      mediaType: MediaType.Pdf,
      size: PDF.byteLength,
    });
    expect(await disk.receive(pending.url, pending.headers, PDF)).toBe(200);
    // #endregion upload

    // #region attach-and-link
    const attachment = await asTenant(acme, () =>
      asServiceRole(() => attachments.attach(pending.upload, "invoice.pdf")),
    );
    expect(attachment.path).toBe(`private/support/ticket_attachments/${pending.upload.id}.pdf`);

    const link = await asTenant(acme, () => asServiceRole(() => attachments.link(attachment.id)));
    expect(link).toMatch(
      /^https:\/\/files\.test\/private\/support\/ticket_attachments\/upl_\w+\.pdf\?expires=/,
    );

    const stranger = asTenant(globex, () => asServiceRole(() => attachments.link(attachment.id)));
    await expect(stranger).rejects.toSatisfy((error: unknown) => isRefusal(error, NotFoundError));
    // #endregion attach-and-link

    // #region claim-once
    const again = asTenant(acme, () =>
      asServiceRole(() => attachments.attach(pending.upload, "invoice.pdf")),
    );
    const refusal: unknown = await again.catch((error: unknown) => error);
    expect(isRefusal(refusal, UploadIncompleteError)).toBe(true);
    // #endregion claim-once
  });

  it("refuses a type the bucket does not take and a file over its size", async () => {
    const { media } = setup();
    // #region refusals
    const gif = media.createUpload(TicketAttachmentsBucket, { mediaType: MediaType.Gif, size: 10 });
    await expect(gif).rejects.toSatisfy((error: unknown) => isRefusal(error, UploadRejectedError));

    const huge = media.createUpload(TicketAttachmentsBucket, {
      mediaType: MediaType.Pdf,
      size: 20_000_000,
    });
    await expect(huge).rejects.toSatisfy((error: unknown) => isRefusal(error, UploadRejectedError));
    // #endregion refusals
  });
});
