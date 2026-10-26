/**
 * Stackra file contract:
 * Purpose: the kit fixtures of the core tests: a minimal `kit.json` text, the kit parsed from it, and a symbol SVG
 *          drawn with `currentColor`.
 * Boundary: test data only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 4).
 */
import { parseKit } from "#core/functions/parse-kit.function";

/** A minimal kit file. */
export const KIT_JSON = JSON.stringify({
  id: "acme",
  name: { en: "Acme", ar: "أكمي" },
  theme: "theme.json",
  symbol: "marks/symbol.svg",
});

/** The kit parsed from `KIT_JSON`. */
export const KIT = parseKit(KIT_JSON, "kit.json");

/** A square symbol. */
export const SYMBOL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M2 2h20v20H2z"/></svg>';
