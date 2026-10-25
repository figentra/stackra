/**
 * Stackra file contract:
 * Purpose: `loadOgFonts`, the card's font faces as the layout engine takes them (`name`, `data`, `weight`, `style`),
 *          each file fetched once per isolate and kept for the next card.
 * Boundary: internal. Each fetch waits at most five seconds; a failed fetch throws and is forgotten, so the next card
 *           tries again instead of caching the failure.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 7).
 */
import { OG_FONTS } from "#core/constants/og-fonts.constant";

/** How long one font fetch may take, in milliseconds. */
const TIMEOUT = 5000;

/** Font bytes by URL, for the life of the isolate. */
const CACHE = new Map<string, Promise<ArrayBuffer>>();

/** The bytes at `url`, fetched once. */
function fontBytes(url: string): Promise<ArrayBuffer> {
  let bytes = CACHE.get(url);
  if (bytes === undefined) {
    bytes = fetch(url, { signal: AbortSignal.timeout(TIMEOUT) }).then(async (response) => {
      if (!response.ok)
        throw new Error(`The Open Graph font ${url} answered HTTP ${response.status}`);
      return response.arrayBuffer();
    });
    bytes.catch(() => CACHE.delete(url));
    CACHE.set(url, bytes);
  }
  return bytes;
}

/**
 * Every card face with its bytes.
 *
 * @throws Error when a font cannot be fetched.
 */
export async function loadOgFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[]
> {
  return Promise.all(
    OG_FONTS.map(async (face) => ({
      name: face.name,
      data: await fontBytes(face.url),
      weight: face.weight,
      style: "normal" as const,
    })),
  );
}
