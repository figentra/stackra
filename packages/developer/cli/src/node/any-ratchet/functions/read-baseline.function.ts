/**
 * Stackra file contract:
 * Purpose: `readBaseline(root)`, the committed `any` ratchet baseline of the workspace at `root` (`BASELINE_FILE`), or
 *          none when the file is missing (moved from `tools/scripts/any-ratchet.mjs`).
 * Boundary: reads one YAML file.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { BASELINE_FILE } from "#node/any-ratchet/constants/baseline-file.constant";

/**
 * Package directory to its allowed disable count.
 *
 * @param root - the workspace root.
 * @example
 * readBaseline(root)["packages/data/model"]; // 1
 */
export function readBaseline(root: string): Record<string, number> {
  const path = join(root, BASELINE_FILE);
  return existsSync(path)
    ? ((parse(readFileSync(path, "utf8")) ?? {}) as Record<string, number>)
    : {};
}
