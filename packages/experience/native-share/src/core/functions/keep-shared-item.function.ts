/**
 * Stackra file contract:
 * Purpose: `keepSharedItem(share, item, files, path)`, which stores a shared file on the app's `FileSystem` disk of
 *          @stackra/filesystem under `path`, with its media type.
 * Boundary: reads through `IncomingShare.read`, so the configuration's type and size checks apply; a text, a link or
 *           a refused file stores nothing and returns `false`. The disk is the one the app binds.
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (one FileSystem port); ADR 0478 (decision 5).
 */
import type { FileSystem } from "@stackra/filesystem/contracts";

import type { IncomingShare } from "#contracts/ports/incoming-share.port";
import type { SharedItem } from "#contracts/types/shared-item.type";

/**
 * Stores one shared file on the app's disk.
 *
 * @example
 * if (await keepSharedItem(share, item, files, `inbox/${item.name}`)) toast.success("Saved");
 */
export async function keepSharedItem(
  share: IncomingShare,
  item: SharedItem,
  files: FileSystem,
  path: string,
): Promise<boolean> {
  const blob = await share.read(item);
  if (blob === null) return false;
  await files.write(path, new Uint8Array(await blob.arrayBuffer()), { contentType: item.mimeType });
  return true;
}
