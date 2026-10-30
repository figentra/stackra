/**
 * Stackra file contract:
 * Purpose: `fileKindOf`, the icon and the short type label ("PDF", "XLSX") of a file, from its MIME type and name.
 * Boundary: pure; the AttachmentCard's type mark on web and native. The label is the extension as written, never
 *           translated; it is empty for a name with no extension.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon of each kind of file, matched on the MIME type, then the extension. */
const KINDS: readonly (readonly [icon: IconName, mime: RegExp, extensions: RegExp])[] = [
  ["file-image", /^image\//u, /^(png|jpe?g|gif|webp|heic|svg|avif)$/u],
  ["file-video-camera", /^video\//u, /^(mp4|mov|webm|mkv)$/u],
  ["file-music", /^audio\//u, /^(mp3|wav|m4a|ogg|aac)$/u],
  ["file-spreadsheet", /spreadsheet|excel|csv/u, /^(xlsx?|csv|ods|numbers)$/u],
  ["file-archive", /zip|compressed|tar|rar/u, /^(zip|rar|7z|tar|gz)$/u],
  ["file-text", /pdf|word|text|document/u, /^(pdf|docx?|txt|rtf|odt|md|pages)$/u],
];

/** The icon name and the upper-case extension of the file called `name`, of MIME type `type`. */
export function fileKindOf(
  name: string,
  type?: string | undefined,
): { readonly icon: IconName; readonly extension: string } {
  const dot = name.lastIndexOf(".");
  const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const kind = KINDS.find(
    ([, mime, extensions]) =>
      (type !== undefined && type !== "" && mime.test(type)) || extensions.test(extension),
  );
  return { icon: kind?.[0] ?? "file", extension: extension.toUpperCase() };
}
