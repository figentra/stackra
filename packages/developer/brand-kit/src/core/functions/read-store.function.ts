/**
 * Stackra file contract:
 * Purpose: `readStore`, the store captions of every app and locale (`<storeDir>/<app>/<locale>/captions.json`) with
 *          the screenshots the capture job left (`<screenshotsDir>/<app>/<locale>/<screen>.png`), plus every file read
 *          for the input hash.
 * Boundary: reads the file system; a malformed captions file is a problem line, never a throw here.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19 store frames and captions from assets/store).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { StoreCaption } from "#contracts/types/store-caption.type";
import type { StoreCaptionSet } from "#contracts/types/store-caption-set.type";
import { listFiles } from "#core/functions/list-files.function";
import type { StoreRead } from "#core/types/store-read.type";

const CAPTIONS = /^([^/]+)\/([^/]+)\/captions\.json$/;

/** The captions in one parsed file, or a problem line. */
function captionsOf(value: unknown, path: string): StoreCaption[] | string {
  const list = (value as { captions?: unknown } | null)?.captions;
  if (!Array.isArray(list)) return `${path}: "captions" must be a list`;
  const out: StoreCaption[] = [];
  for (const item of list) {
    const { screen, text } = (item ?? {}) as Record<string, unknown>;
    if (
      typeof screen !== "string" ||
      !/^[A-Za-z0-9_-]+$/.test(screen) ||
      typeof text !== "string" ||
      !text.trim()
    )
      return `${path}: each caption needs a "screen" id and a "text"`;
    out.push({ screen, text });
  }
  return out;
}

/**
 * Every caption set under `storeDir`, sorted by app then locale.
 *
 * @example
 * const { sets, problems } = await readStore("/repo/assets/store", "/repo/.stackra/screenshots");
 */
export async function readStore(storeDir: string, screenshotsDir: string): Promise<StoreRead> {
  const sets: StoreCaptionSet[] = [];
  const read = new Map<string, Uint8Array>();
  const problems: string[] = [];
  for (const rel of await listFiles(storeDir)) {
    const match = CAPTIONS.exec(rel);
    if (!match) continue;
    const [, app = "", locale = ""] = match;
    const bytes = new Uint8Array(await readFile(join(storeDir, rel)));
    read.set(`store/${rel}`, bytes);
    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      problems.push(`store/${rel}: not JSON`);
      continue;
    }
    const captions = captionsOf(parsed, `store/${rel}`);
    if (typeof captions === "string") {
      problems.push(captions);
      continue;
    }
    const screenshots = new Map<string, Uint8Array>();
    for (const { screen } of captions) {
      const shot = `${app}/${locale}/${screen}.png`;
      try {
        const png = new Uint8Array(await readFile(join(screenshotsDir, shot)));
        screenshots.set(screen, png);
        read.set(`screenshots/${shot}`, png);
      } catch {
        // no capture yet: the frame draws an empty screen
      }
    }
    sets.push({ app, locale, captions, screenshots });
  }
  return { sets, read, problems };
}
