/**
 * Stackra file contract:
 * Purpose: `readKit`, everything one run reads: the validated `kit.json`, the theme (the kit's `tokens/theme.json`
 *          over the parent kit's over the stackra theme), the kit's file list and sources, its fonts, the store
 *          captions and screenshots, and the hash of all of it.
 * Boundary: reads the file system only, never writes. The parent kit is a folder of data (`parentKitDir`); no parent
 *           kit code is imported. Any unreadable input throws one InvalidBrandKitError listing every problem.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: product sources in <repo>/assets/brand; the parent plugs in as data).
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { InvalidThemeError, parseThemeJson, STACKRA_THEME } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";

import type { BrandKit } from "#contracts/types/brand-kit.type";
import type { BrandKitRunOptions } from "#contracts/types/brand-kit-run-options.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import { BRAND_DEFAULTS } from "#core/constants/brand-defaults.constant";
import { KIT_SOURCES } from "#core/constants/kit-sources.constant";
import { InvalidBrandKitError } from "#core/errors/invalid-brand-kit.error";
import { isLogoFile } from "#core/functions/is-logo-file.function";
import { listFiles } from "#core/functions/list-files.function";
import { readStore } from "#core/functions/read-store.function";
import { sha256Hex } from "#core/functions/sha256-hex.function";
import { validateKitJson } from "#core/functions/validate-kit-json.function";

const FONT = /\.(ttf|otf)$/i;

const decode = (bytes: Uint8Array | undefined) => new TextDecoder().decode(bytes);

/** The theme in `text` over `base`, or the problems as kit lines. */
function themeOver(text: string, base: Theme, path: string): Theme | string[] {
  try {
    return parseThemeJson(text, base);
  } catch (error) {
    if (error instanceof InvalidThemeError)
      return error.problems.map((problem) => `${path}: ${problem}`);
    throw error;
  }
}

/**
 * The kit `options` point at, read and checked.
 *
 * @example
 * const input = await readKit({ root: "/repo", parentKitDir: "/os/tools/brand-kit/figentra" });
 * @throws InvalidBrandKitError when kit.json is missing or breaks its rules, or a theme or captions file is unusable.
 */
export async function readKit(options: BrandKitRunOptions = {}): Promise<KitInput> {
  const root = resolve(options.root ?? ".");
  const kitDir = join(root, options.kitDir ?? BRAND_DEFAULTS.kitDir);
  const read = new Map<string, Uint8Array>();
  const problems: string[] = [];
  const files = await listFiles(kitDir);
  if (!files.includes(KIT_SOURCES.kit))
    throw new InvalidBrandKitError([`kit.json: not found in ${kitDir}`]);

  const sources = new Map<string, Uint8Array>();
  const sourcePaths = new Set<string>([
    ...Object.values(KIT_SOURCES).filter((path) => files.includes(path)),
    ...files.filter(isLogoFile),
  ]);
  for (const path of [...sourcePaths].sort()) {
    const bytes = new Uint8Array(await readFile(join(kitDir, path)));
    sources.set(path, bytes);
    read.set(`kit/${path}`, bytes);
  }

  let kitValue: unknown;
  try {
    kitValue = JSON.parse(decode(sources.get(KIT_SOURCES.kit)));
  } catch {
    throw new InvalidBrandKitError(["kit.json: not JSON"]);
  }
  problems.push(...validateKitJson(kitValue));

  let theme: Theme = STACKRA_THEME;
  if (options.parentKitDir) {
    const parentTheme = join(resolve(root, options.parentKitDir), KIT_SOURCES.theme);
    const bytes = await readFile(parentTheme).then(
      (buffer) => new Uint8Array(buffer),
      () => undefined,
    );
    if (bytes) {
      read.set(`parent/${KIT_SOURCES.theme}`, bytes);
      const parsed = themeOver(decode(bytes), theme, `parent ${KIT_SOURCES.theme}`);
      if (Array.isArray(parsed)) problems.push(...parsed);
      else theme = parsed;
    }
  }
  const kitTheme = sources.get(KIT_SOURCES.theme);
  if (kitTheme) {
    const parsed = themeOver(decode(kitTheme), theme, KIT_SOURCES.theme);
    if (Array.isArray(parsed)) problems.push(...parsed);
    else theme = parsed;
  }

  const fonts: Uint8Array[] = [];
  for (const path of files.filter(
    (file) => file.startsWith(`${KIT_SOURCES.fonts}/`) && FONT.test(file),
  )) {
    const bytes = new Uint8Array(await readFile(join(kitDir, path)));
    fonts.push(bytes);
    read.set(`kit/${path}`, bytes);
  }

  const store = await readStore(
    join(root, options.storeDir ?? BRAND_DEFAULTS.storeDir),
    join(root, options.screenshotsDir ?? BRAND_DEFAULTS.screenshotsDir),
  );
  problems.push(...store.problems);
  for (const [path, bytes] of store.read) read.set(path, bytes);

  if (problems.length > 0) throw new InvalidBrandKitError(problems);

  const inputHash = sha256Hex(
    [...read.keys()]
      .sort()
      .map((path) => `${path}\0${sha256Hex(read.get(path) ?? new Uint8Array())}`)
      .join("\n"),
  );
  return { kit: kitValue as BrandKit, theme, files, sources, fonts, store: store.sets, inputHash };
}
