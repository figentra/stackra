/**
 * Stackra file contract:
 * Purpose: `tarballSpecs(directory)`, the `file:` dependency spec of each packed Stackra tarball in a folder, by
 *          package name (`stackra-console-0.0.0.tgz` → `@stackra/console`), for the scaffolder's verification runs.
 * Boundary: reads one directory listing; nothing else.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-029 and SC-001.
 */
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

/** `file:` specs of the `@stackra/*` tarballs in `directory`. */
export function tarballSpecs(directory: string): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const file of readdirSync(directory)) {
    const match = /^stackra-(.+?)-\d+\.\d+\.\d+(?:-[\w.]+)?\.tgz$/.exec(file);
    if (match?.[1] !== undefined)
      specs[`@stackra/${match[1]}`] = `file:${resolve(directory, file)}`;
  }
  return specs;
}
