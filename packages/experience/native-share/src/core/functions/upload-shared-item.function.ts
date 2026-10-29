/**
 * Stackra file contract:
 * Purpose: `uploadSharedItem(share, item, uploader, bucket)`, which uploads a shared file into a @stackra/media
 *          bucket through the app's `Uploader` and returns the `Upload` token an action takes.
 * Boundary: reads through `IncomingShare.read`, so the configuration's checks apply; a text, a link or a refused file
 *           uploads nothing and returns `null`. The bucket still checks type and size when the action claims it.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: signed direct uploads); ADR 0478 (decision 5).
 */
import type { Upload, Uploader } from "@stackra/media";

import type { IncomingShare } from "#contracts/ports/incoming-share.port";
import type { SharedItem } from "#contracts/types/shared-item.type";

/**
 * Uploads one shared file into a media bucket.
 *
 * @example
 * const upload = await uploadSharedItem(share, item, uploader, "documents.receipts");
 * if (upload !== null) await client.documents.receipt.create({ file: upload });
 */
export async function uploadSharedItem(
  share: IncomingShare,
  item: SharedItem,
  uploader: Uploader,
  bucket: string | null,
): Promise<Upload | null> {
  const blob = await share.read(item);
  return blob === null ? null : uploader.upload(blob, bucket);
}
