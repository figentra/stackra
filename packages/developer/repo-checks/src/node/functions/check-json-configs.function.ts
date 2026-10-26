/**
 * Stackra file contract:
 * Purpose: `checkJsonConfigs(paths)`, every *.json path not on `MUST_STAY_JSON` (its reader takes comments, so at least
 *          .jsonc) and every *.jsonc path not on `MUST_STAY_JSONC` (repo-owned config is YAML).
 * Boundary: pure: paths only.
 * Runtime: node
 * Governing contract: the YAML standard (STA-299).
 */
import { MUST_STAY_JSON } from "#node/constants/must-stay-json.constant";
import { MUST_STAY_JSONC } from "#node/constants/must-stay-jsonc.constant";

/**
 * The JSON-versus-JSONC-versus-YAML findings for `paths`.
 *
 * @param paths - repository-relative paths.
 * @example
 * checkJsonConfigs(["tools/x.json"]); // one finding
 */
export function checkJsonConfigs(paths: readonly string[]): string[] {
  const out: string[] = [];
  for (const p of paths) {
    if (p.endsWith(".json") && !MUST_STAY_JSON.some(([re]) => re.test(p)))
      out.push(
        `${p}: convert to .yaml (or .jsonc if its reader has no YAML support), or add it to MUST_STAY_JSON with the reason`,
      );
    else if (p.endsWith(".jsonc") && !MUST_STAY_JSONC.some(([re]) => re.test(p)))
      out.push(
        `${p}: convert to .yaml, or add it to MUST_STAY_JSONC naming the reader without YAML support`,
      );
  }
  return out;
}
