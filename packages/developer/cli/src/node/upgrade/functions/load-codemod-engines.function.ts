/**
 * Stackra file contract:
 * Purpose: `loadCodemodEngines()`, ast-grep (`@ast-grep/napi`) and ts-morph, imported on first use: an upgrade with a
 *          source codemod is the only run that needs them, so no other `stackra` command loads a native module or a
 *          TypeScript compiler for them.
 * Boundary: imports two dependencies of this package; no other side effect.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2: ast-grep and ts-morph); STA-145.
 */
import type { CodemodEngines } from "#node/upgrade/types/codemod-engines.type";

/**
 * Load both engines.
 *
 * @example
 * const { astGrep, tsMorph } = await loadCodemodEngines();
 */
export async function loadCodemodEngines(): Promise<CodemodEngines> {
  const [astGrep, tsMorph] = await Promise.all([import("@ast-grep/napi"), import("ts-morph")]);
  return { astGrep, tsMorph };
}
