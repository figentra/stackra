/**
 * Stackra file contract:
 * Purpose: `mediaUrl`, the `url()` of every media disk: the base, one `/`, then the path with each segment
 *          percent-encoded.
 * Boundary: pure; internal to this package. Never checks that the object exists.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 3: public files from a CDN bucket).
 */

/**
 * The URL of `path` under `base`.
 *
 * @example
 * mediaUrl("https://cdn.test/files/", "public/a b.png"); // "https://cdn.test/files/public/a%20b.png"
 */
export function mediaUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
