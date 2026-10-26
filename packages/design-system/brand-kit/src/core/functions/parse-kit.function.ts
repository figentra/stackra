/**
 * Stackra file contract:
 * Purpose: `parseKit(text, source)`, reads `kit.json`: parses the JSON, checks it against `BRAND_KIT_SCHEMA` and fills
 *          every optional block from `KIT_DEFAULTS`, field by field, so a kit states only what differs.
 * Boundary: pure. The text comes from a product repository, so it is parsed as JSON only and checked before any field
 *           is read. Unknown top-level fields are the kit owner's data and are dropped from the result.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 4 and 5); the configuration-not-code rule.
 */
import type { BrandKit } from "#contracts/types/brand-kit.type";
import { BRAND_KIT_SCHEMA } from "#core/constants/brand-kit-schema.constant";
import { KIT_DEFAULTS } from "#core/constants/kit-defaults.constant";
import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { validateJsonSchema } from "#core/functions/validate-json-schema.function";

/**
 * The kit `text` holds, defaults applied.
 *
 * @param text - the text of `kit.json`.
 * @param source - where it was read from, for the error.
 * @throws InvalidKitError when the text is not JSON or breaks the schema.
 * @example
 * const kit = parseKit(readFileSync("assets/brand/kit.json", "utf8"), "assets/brand/kit.json");
 * kit.icon.scale; // 0.58 unless the kit sets it
 */
export function parseKit(text: string, source: string): BrandKit {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new InvalidKitError(source, [`not JSON: ${(error as Error).message}`]);
  }
  const problems = validateJsonSchema(BRAND_KIT_SCHEMA, data);
  if (problems.length > 0) throw new InvalidKitError(source, problems);
  const raw = data as Partial<BrandKit> & Pick<BrandKit, "id" | "name" | "theme" | "symbol">;
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.shortName ?? raw.name["en"] ?? raw.id,
    theme: raw.theme,
    symbol: raw.symbol,
    icon: { ...KIT_DEFAULTS.icon, ...raw.icon },
    splash: { ...KIT_DEFAULTS.splash, ...raw.splash },
    manifest: { ...KIT_DEFAULTS.manifest, ...raw.manifest },
    store: { ...KIT_DEFAULTS.store, ...raw.store },
    check: { ...KIT_DEFAULTS.check, ...raw.check },
  };
}
