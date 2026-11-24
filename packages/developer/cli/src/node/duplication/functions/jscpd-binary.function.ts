/**
 * Stackra file contract:
 * Purpose: `jscpdBinary(root)`, the path of the repository's own jscpd binary, or a refusal that says what to install:
 *          `stackra duplication` runs `node_modules/.bin/jscpd` of the workspace, and a repository that does not install
 *          jscpd (a product made with `stackra create`) used to fail with a bare "jscpd ENOENT".
 * Boundary: reads one path under `root`.
 * Runtime: node
 * Governing contract: ADR 0305; the versions rule (jscpd is pinned in the `quality` catalog).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * The jscpd binary of `root`.
 *
 * @param root - the workspace root.
 * @throws Error naming the dependency to add when the binary is not installed.
 * @example
 * jscpdBinary(root); // "<root>/node_modules/.bin/jscpd"
 */
export function jscpdBinary(root: string): string {
  const binary = join(root, "node_modules", ".bin", "jscpd");
  if (!existsSync(binary))
    throw new Error(
      `stackra duplication needs jscpd, which is not installed in ${root}: add \`jscpd\` to the root devDependencies (core pins it in the \`quality\` catalog) and install`,
    );
  return binary;
}
