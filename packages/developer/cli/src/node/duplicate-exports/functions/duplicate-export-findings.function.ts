/**
 * Stackra file contract:
 * Purpose: `duplicateExportFindings(root, allowed?, pending?)`, the duplicate-export findings of `pnpm validate`
 *          (stackra-224): one per exported name declared in two packages that neither list exempts, plus one per
 *          `PENDING` entry whose duplicate is gone, so that list only shrinks (rule-gap N-6) (moved from
 *          `tools/scripts/duplicate-exports.mjs`).
 * Boundary: reads the workspace sources; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0305 (one declaration per file, one home per concept); stackra-224 (STA-1382).
 */
import { ALLOWED } from "#node/duplicate-exports/constants/allowed.constant";
import { PENDING } from "#node/duplicate-exports/constants/pending.constant";
import { duplicateExports } from "#node/duplicate-exports/functions/duplicate-exports.function";
import { sorted } from "#node/functions/sorted.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * The findings of the workspace at `root`.
 *
 * @param root - the workspace root.
 * @param allowed - the intended copies; `ALLOWED` by default, tests pass their own.
 * @param pending - the copies another batch removes; `PENDING` by default.
 * @example
 * duplicateExportFindings(root); // [] when every duplicate is exempt
 */
export function duplicateExportFindings(
  root: string,
  allowed: Readonly<Record<string, string>> = ALLOWED,
  pending: Readonly<Record<string, string>> = PENDING,
): DirFinding[] {
  const duplicates = duplicateExports(root);
  const copies = [...duplicates]
    .filter(([exported]) => !Object.hasOwn(allowed, exported) && !Object.hasOwn(pending, exported))
    .map(([exported, rows]) => ({
      dir: rows[0]?.file.split(/[/\\]src[/\\]/)[0] ?? "",
      text:
        `exported name ${exported} is declared in ${rows.map((row) => `${row.name} (${row.file})`).join(", ")}: ` +
        "give it one home and import it (helpers go to @stackra/support), or add it to ALLOWED in " +
        "packages/developer/cli/src/node/duplicate-exports/constants/allowed.constant.ts with the reason",
    }));
  // PENDING is a ratchet that only shrinks: an entry whose duplicate is gone must leave the list (rule-gap N-6).
  const stale = sorted(Object.keys(pending).filter((name) => !duplicates.has(name))).map(
    (name) => ({
      dir: "packages/developer/cli",
      text: `PENDING name ${name} is no longer declared in two packages: delete it from PENDING in pending.constant.ts`,
    }),
  );
  return [...copies, ...stale];
}
