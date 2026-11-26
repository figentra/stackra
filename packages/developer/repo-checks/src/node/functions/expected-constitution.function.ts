/**
 * Stackra file contract:
 * Purpose: `expectedConstitution(root)`: what `renderConstitution` makes of the workspace's docs laws, or undefined for
 *          a workspace without them.
 * Boundary: reads the laws; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0510; STA-2098 (H6).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CONSTITUTION_PATHS } from "#node/constants/constitution-paths.constant";
import { renderConstitution } from "#node/functions/render-constitution.function";

/**
 * The constitution's expected text at `root`, or undefined when the workspace has no laws.
 *
 * @param root - the workspace root.
 * @example
 * expectedConstitution(root);
 */
export function expectedConstitution(root: string): string | undefined {
  const dir = join(root, CONSTITUTION_PATHS.source);
  if (!existsSync(dir)) return undefined;
  return renderConstitution(
    readdirSync(dir)
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") })),
  );
}
