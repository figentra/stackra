/**
 * Stackra file contract:
 * Purpose: `readI18nReferences`, discovery's read of every `I18n.<namespace>.<path>` chain in the member's own files
 *          that import `#stackra/i18n` (tests included), so gen refuses a key no catalogue ships (`i18n_key_missing`,
 *          STA-1298) instead of a test crashing at load.
 * Boundary: reads `.ts` and `.tsx` files under the member root, skipping `node_modules`, `dist` and dot folders
 *           (`.stackra`); writes nothing. A chain ends at the first `[`, `(` or non-identifier, so
 *           `I18n.loyalty_kit.enums.loyalty_tier[tier]` is the branch `loyalty_kit.enums.loyalty_tier`. Comment
 *           lines (`//`, ` * `) are skipped.
 * Runtime: node
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>`); STA-1298.
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";

import type { MemberIR } from "#core/types/member-ir.type";
import { sourceFiles } from "#node/functions/source-files.function";

/** An `I18n` chain; the lookbehind keeps `xI18n.` and `.I18n.` out. */
const CHAIN = /(?<![\w$.])I18n((?:\s*\??\.\s*[A-Za-z_$][\w$]*)+)/g;

/**
 * Every `I18n` key reference of the member at `root`, with its file (relative), 1-based line and column.
 *
 * @param root - the member root.
 * @example
 * readI18nReferences("services/customers")[0]?.path; // ["loyalty_kit", "enums", "loyalty_tier"]
 */
export function readI18nReferences(root: string): NonNullable<MemberIR["i18nReferences"]> {
  const found: { file: string; line: number; column: number; path: string[] }[] = [];
  for (const path of sourceFiles(root)) {
    const text = readFileSync(path, "utf8");
    if (!text.includes("#stackra/i18n")) continue;
    text.split("\n").forEach((line, index) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      for (const match of line.matchAll(CHAIN))
        found.push({
          file: relative(root, path),
          line: index + 1,
          column: (match.index ?? 0) + 1,
          path: (match[1] ?? "")
            .split(".")
            .map((segment) => segment.replaceAll(/[\s?]/g, ""))
            .filter((segment) => segment !== ""),
        });
    });
  }
  return found;
}
