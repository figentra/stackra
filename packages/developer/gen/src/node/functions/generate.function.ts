/**
 * Stackra file contract:
 * Purpose: `generate`, one gen-core run over a member: discovery, the pure `generateMember`, then either writing the
 *          files (creating folders) or, with `check`, comparing them with what is on disk, which is
 *          `stackra gen --check` (a stale or missing file, or a changed identity without `@Renamed`, fails it).
 * Boundary: writes only under the member root and only when the run has no error; a check writes nothing. The
 *           committed `stackra.manifest.json` is read first, so its identities stay locked.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: the committed manifest and `stackra gen --check`); ADR 0295
 *                     (decision 5: generated files are overwritten); ADR 0261.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { generateMember } from "#core/functions/generate-member.function";
import { discoverMember } from "#node/functions/discover-member.function";
import type { GenerateResult } from "#node/types/generate-result.type";

/**
 * Runs gen-core on the member at `root`.
 *
 * @param root - the member root.
 * @param options - `check` compares instead of writing; `backend` picks the TypeScript host.
 * @throws Error when package.json, tsconfig.json or a dependency manifest cannot be read.
 * @example
 * const { errors, changed } = await generate("packages/commerce/loyalty-kit", { check: true });
 */
export async function generate(
  root: string,
  options: { readonly check?: boolean; readonly backend?: "tsgo" | "ts6" } = {},
): Promise<GenerateResult> {
  const ir = await discoverMember(
    root,
    options.backend === undefined ? {} : { backend: options.backend },
  );
  const manifestPath = join(root, "stackra.manifest.json");
  const previous = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, "utf8")) as StackraManifest)
    : undefined;
  const { files, errors } = generateMember(ir, previous);
  if (errors.length > 0) return { errors, files: [], changed: [] };
  const changed: string[] = [];
  for (const file of files) {
    const path = join(root, file.path);
    const current = existsSync(path) ? readFileSync(path, "utf8") : undefined;
    if (current === file.content) continue;
    changed.push(file.path);
    if (options.check === true) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content);
  }
  return { errors: [], files, changed };
}
