/**
 * Stackra file contract:
 * Purpose: `generate`, one gen-core run over a member: discovery, the pure `generateMember`, then either writing the
 *          files (creating folders) or, with `check`, comparing them with what is on disk, which is
 *          `stackra gen --check` (a stale or missing file, or a changed identity without `@Renamed`, fails it). With
 *          `pass: "manifests"` it writes the manifest alone (`stackra gen --manifests`, the first pass of a workspace
 *          run); otherwise a refused run that consumes another service writes its client files first and runs again,
 *          since a shape typed with a client's enum only resolves once that client is on disk, and when it is still
 *          refused writes its manifest if only consumed workspace services stand in the way.
 * Boundary: writes only under the member root; a check writes nothing. A refused run writes nothing but the client
 *           files (when the clients target itself is clean) and the manifest (when the manifest pass is clean). The
 *           committed `stackra.manifest.json` is read first, so its identities stay locked. An authored root
 *           `vitest.config.ts` (no generated notice) is never overwritten: one that imports `./.stackra/vitest.config`
 *           is kept and the shim skipped; any other is refused as `shim_authored` (STA-1296, STA-1297).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: the committed manifest and `stackra gen --check`); ADR 0295
 *                     (decision 5: generated files are overwritten); ADR 0261; ADR 0260 (a cycle between services is
 *                     allowed at the manifest level).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { ROOT_VITEST_SHIM } from "#core/constants/root-vitest-shim.constant";
import { generateMember } from "#core/functions/generate-member.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import { discoverMember } from "#node/functions/discover-member.function";
import type { GenerateResult } from "#node/types/generate-result.type";

/** An authored root config that imports the generated one (`./.stackra/vitest.config`, with or without `.ts`). */
const MERGES_GENERATED_VITEST = /["']\.\/\.stackra\/vitest\.config(?:\.ts)?["']/;

/** The paths of `files` that differ from disk under `root`, written unless `check`. */
function write(root: string, files: readonly GeneratedFile[], check: boolean): string[] {
  const changed: string[] = [];
  for (const file of files) {
    const path = join(root, file.path);
    const current = existsSync(path) ? readFileSync(path, "utf8") : undefined;
    if (current === file.content) continue;
    changed.push(file.path);
    if (check) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content);
  }
  return changed;
}

/**
 * Runs gen-core on the member at `root`.
 *
 * @param root - the member root.
 * @param options - `check` compares instead of writing; `backend` picks the TypeScript host; `pass: "manifests"`
 *                  writes the manifest alone.
 * @throws Error when package.json, tsconfig.json or a dependency manifest cannot be read.
 * @example
 * const { errors, changed } = await generate("packages/commerce/loyalty-kit", { check: true });
 */
export async function generate(
  root: string,
  options: {
    readonly check?: boolean;
    readonly backend?: "tsgo" | "ts6";
    readonly pass?: "manifests";
  } = {},
): Promise<GenerateResult> {
  const discover = () =>
    discoverMember(root, options.backend === undefined ? {} : { backend: options.backend });
  const manifestPath = join(root, "stackra.manifest.json");
  const previous = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, "utf8")) as StackraManifest)
    : undefined;
  const check = options.check === true;
  let ir = await discover();
  let result = generateMember(
    ir,
    previous,
    options.pass === undefined ? {} : { pass: options.pass },
  );
  const partial: string[] = [];
  if (result.errors.length > 0 && !check && options.pass === undefined) {
    const clients = generateMember(ir, previous, { pass: "clients" });
    if (clients.errors.length === 0) partial.push(...write(root, clients.files, false));
    if (partial.length > 0) {
      ir = await discover();
      result = generateMember(ir, previous);
    }
    // Still refused: the manifest alone, when only workspace services still to come stand in its way.
    const manifest =
      result.errors.length > 0 ? generateMember(ir, previous, { pass: "manifests" }) : undefined;
    if (manifest?.errors.length === 0) partial.push(...write(root, manifest.files, false));
  }
  if (result.errors.length > 0) return { errors: result.errors, files: [], changed: partial };
  // An authored root vitest.config.ts is never overwritten by the shim. One that merges the generated config is kept
  // and the shim is not written; any other is refused (STA-1296, STA-1297).
  const shimPath = join(root, ROOT_VITEST_SHIM);
  const authored =
    result.files.some((file) => file.path === ROOT_VITEST_SHIM) && existsSync(shimPath)
      ? readFileSync(shimPath, "utf8")
      : undefined;
  if (authored !== undefined && !authored.includes(GENERATED_NOTICE)) {
    if (!MERGES_GENERATED_VITEST.test(authored))
      return {
        errors: [
          {
            code: "shim_authored",
            file: ROOT_VITEST_SHIM,
            line: 0,
            column: 0,
            subject: ROOT_VITEST_SHIM,
            message:
              "an authored vitest.config.ts sits at the member root and does not import ./.stackra/vitest.config, so the generated setup never loads",
            fix: 'import the generated config and merge it: `import generated from "./.stackra/vitest.config"; export default mergeConfig(generated, { ... })`, or delete the file so gen writes the shim',
          },
        ],
        files: [],
        changed: partial,
      };
    result = { ...result, files: result.files.filter((file) => file.path !== ROOT_VITEST_SHIM) };
  }
  return {
    errors: [],
    files: result.files,
    changed: [...new Set([...partial, ...write(root, result.files, check)])],
  };
}
