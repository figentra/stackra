/**
 * Stackra file contract:
 * Purpose: `publicUrl`, the `url()` of every disk that serves its files from a configured base (`filesystem.url`):
 *          the base, one `/`, then the key with each segment percent-encoded.
 * Boundary: pure; internal to this package. Never checks that the file exists.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7: `disk.url()`); ADR 0222 (decision 3: public files from a CDN bucket).
 */
import { normalizePath } from "#core/functions/normalize-path.function";

/**
 * The public URL of `path` under `base`.
 *
 * @throws Error when `base` is `null` (the disk has no public URL).
 * @throws RangeError when `path` is not a key inside the disk.
 * @example
 * publicUrl("https://cdn.example.com/files/", "a b/c.png"); // "https://cdn.example.com/files/a%20b/c.png"
 */
export function publicUrl(base: string | null, path: string): string {
  if (base === null)
    throw new Error("This disk has no public URL: set `filesystem.url` to serve its files");
  const key = normalizePath(path).split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/+$/, "")}/${key}`;
}
