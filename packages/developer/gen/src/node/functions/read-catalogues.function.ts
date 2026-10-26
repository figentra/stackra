/**
 * Stackra file contract:
 * Purpose: `readCatalogues`, discovery's read of a member's lang catalogues: every `assets/lang/<locale>/<namespace>.json`
 *          as locale to namespace to the parsed JSON, which the i18n target turns into `#stackra/i18n`.
 * Boundary: reads only under `<root>/assets/lang`; writes nothing. A member without the folder has no catalogues
 *           (undefined); a file that is not valid JSON throws with its path, like an unreadable dependency manifest.
 * Runtime: node
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1: `assets/lang/<locale>/<namespace>.json`); ADR 0268
 *                     (R15: typed keys); STA-1293.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The lang catalogues of the member at `root`, or undefined when it has no `assets/lang` with a JSON file.
 *
 * @param root - the member root.
 * @throws Error when a catalogue is not valid JSON.
 * @example
 * readCatalogues("services/sales")?.["en"]?.["carts"]; // the parsed assets/lang/en/carts.json
 */
export function readCatalogues(root: string): MemberIR["catalogues"] {
  const folder = join(root, "assets", "lang");
  if (!existsSync(folder)) return undefined;
  const catalogues: Record<string, Record<string, unknown>> = {};
  for (const locale of readdirSync(folder, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue;
    const files = readdirSync(join(folder, locale.name)).filter((name) => name.endsWith(".json"));
    for (const file of files.sort()) {
      const path = join(folder, locale.name, file);
      try {
        (catalogues[locale.name] ??= {})[file.slice(0, -".json".length)] = JSON.parse(
          readFileSync(path, "utf8"),
        ) as unknown;
      } catch (error) {
        throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, { cause: error });
      }
    }
  }
  return Object.keys(catalogues).length > 0 ? catalogues : undefined;
}
