/**
 * Stackra file contract:
 * Purpose: `generate`, one gen-core run over a member: discovery, the pure `generateMember`, then either writing the
 *          files (creating folders) or, with `check`, comparing them with what is on disk, which is
 *          `stackra gen --check` (a stale or missing file, the committed `stackra.manifest.json` included, or a changed
 *          identity without `@Renamed`, fails it; for a package so does a package.json `files` that leaves the manifest
 *          out, `manifest_unshipped`, since a host reads it under node_modules, STA-1308). With
 *          `pass: "manifests"` it writes the manifest alone (`stackra gen --manifests`, the first pass of a workspace
 *          run); otherwise a refused run that consumes another service writes its client files first and runs again,
 *          since a shape typed with a client's enum only resolves once that client is on disk, and when it is still
 *          refused writes its manifest if only consumed workspace services stand in the way.
 * Boundary: writes only under the member root; a check writes nothing. A refused run writes nothing but the client
 *           files (when the clients target itself is clean) and the manifest (when the manifest pass is clean). The
 *           committed `stackra.manifest.json` is read first, so its identities stay locked. An authored root
 *           `vitest.config.ts` (no generated notice) is never overwritten: one that imports `./.stackra/vitest.config`
 *           is kept and the shim skipped; any other is refused as `shim_authored` (STA-1296, STA-1297), and so is an
 *           authored root `tsdown.config.ts` that does not import `./.stackra/tsdown.config` when gen writes one
 *           (STA-1306). A root `*.extend.ts` hatch outside the closed set (vite, expo, metro, desktop, pwa) or without
 *           a `Reason:` header is refused as `tool_reason_missing` (STA-1306); whether a hatch changes an owned key is
 *           not checked, since gen does not apply hatches yet. A docs app (`src/config/docs.config.ts`) takes the
 *           docs-site run instead (`generateDocsSite`, STA-1316): it has no module graph, writes only
 *           `.stackra/site/`, and its manifest pass writes nothing. A service's full run also writes
 *           `.stackra/encore/encore.app` from the root runway's `providers.encore.app` (`encore_app_missing` without
 *           it), and any run refuses an `encore.app` at the member or repository root (`encore_app_stray`, STA-1322).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: the committed manifest and `stackra gen --check`); ADR 0295
 *                     (decision 5: generated files are overwritten); ADR 0261; ADR 0260 (a cycle between services is
 *                     allowed at the manifest level); ADR 0091 (decision 2) and ADR 0029 (the Encore app file).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { DOCS_CONFIG_FILE } from "#core/constants/docs-config-file.constant";
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { ROOT_VITEST_SHIM } from "#core/constants/root-vitest-shim.constant";
import { generateMember } from "#core/functions/generate-member.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import { discoverMember } from "#node/functions/discover-member.function";
import { encoreApp } from "#node/functions/encore-app.function";
import { generateDocsSite } from "#node/functions/generate-docs-site.function";
import type { GenerateResult } from "#node/types/generate-result.type";

/** The committed manifest at the member root. */
const MANIFEST_FILE = "stackra.manifest.json";

/** The tool configs gen writes under `.stackra/` that an authored root config may only merge, never replace. */
const TOOL_CONFIGS = ["vitest", "tsdown"] as const;

/** The closed set of code hatches at the member root (ADR 0295 decision 6, `desktop` after ADR 0326, `pwa`). */
const HATCHES = new Set(["vite", "expo", "metro", "desktop", "pwa"]);

/** The comments a file opens with, and the `Reason:` header a hatch carries among them. */
const LEADING_COMMENTS = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*/;
const LEADING_REASON = /\breason:/i;

/** An authored root config that imports the generated one (`./.stackra/<tool>.config`, with or without `.ts`). */
const mergesGenerated = (tool: string, source: string): boolean =>
  new RegExp(`["']\\./\\.stackra/${tool}\\.config(?:\\.ts)?["']`).test(source);

/** One whole-file refusal at the member root. */
const refusal = (code: string, file: string, message: string, fix: string): GenError => ({
  code,
  file,
  line: 0,
  column: 0,
  subject: file,
  message,
  fix,
});

/**
 * The `*.extend.ts` hatches at `root` that gen refuses (`tool_reason_missing`, STA-1306): one outside the closed set,
 * or one that does not open with a `Reason:` header. Whether a hatch changes an owned key is not checked yet.
 */
function hatchErrors(root: string): GenError[] {
  const errors: GenError[] = [];
  for (const file of readdirSync(root)
    .filter((name) => name.endsWith(".extend.ts"))
    .sort()) {
    const tool = file.slice(0, -".extend.ts".length);
    if (!HATCHES.has(tool))
      errors.push(
        refusal(
          "tool_reason_missing",
          file,
          `${file} is not a code hatch gen knows: the closed set is ${[...HATCHES].map((name) => `${name}.extend.ts`).join(", ")}`,
          "move the setting into its typed section of stackra.config.ts, or into one of the known hatches",
        ),
      );
    else if (
      !LEADING_REASON.test(LEADING_COMMENTS.exec(readFileSync(join(root, file), "utf8"))?.[0] ?? "")
    )
      errors.push(
        refusal(
          "tool_reason_missing",
          file,
          `${file} does not open with a \`Reason:\` header`,
          `open ${file} with a comment saying why stackra.config.ts cannot express it: \`// Reason: <why>\``,
        ),
      );
  }
  return errors;
}

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
  // A docs app has no classes to discover: its run assembles the Mintlify site (ADR 0002, 2026-10-27 amendment).
  if (existsSync(join(root, DOCS_CONFIG_FILE)))
    return options.pass === "manifests"
      ? { errors: [], files: [], changed: [] }
      : generateDocsSite(root, options.check === undefined ? {} : { check: options.check });
  const discover = () =>
    discoverMember(root, options.backend === undefined ? {} : { backend: options.backend });
  const manifestPath = join(root, MANIFEST_FILE);
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
  // A package ships its manifest: a host's gen reads it under node_modules (ADR 0158, STA-1308).
  if (check && ir.layout === "package") {
    const { files } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      readonly files?: unknown;
    };
    if (Array.isArray(files) && !files.includes(MANIFEST_FILE))
      return {
        errors: [
          {
            code: "manifest_unshipped",
            file: "package.json",
            line: 0,
            column: 0,
            subject: "files",
            message: `package.json \`files\` leaves out ${MANIFEST_FILE}, so a host cannot read this package's drivers, configs and identities`,
            fix: `add "${MANIFEST_FILE}" to \`files\` in package.json`,
          },
        ],
        files: [],
        changed: partial,
      };
  }
  // An authored root tool config is never overwritten. One that merges the generated config is kept (and the vitest
  // shim is not written); any other is refused (STA-1296, STA-1297; every generated tool config since STA-1306). A
  // code hatch outside the closed set or without its `Reason:` header is refused too.
  // The Encore app file of a service, from the root runway's `providers.encore.app`; a stray encore.app outside
  // `.stackra/encore` is refused (STA-1322).
  const encore = encoreApp(root, ir.layout === "service" && options.pass === undefined);
  const errors = [...hatchErrors(root), ...encore.errors];
  let files = [...result.files, ...encore.files];
  for (const tool of TOOL_CONFIGS) {
    const config = `${tool}.config.ts`;
    if (
      !files.some((file) => file.path === `.stackra/${config}`) ||
      !existsSync(join(root, config))
    )
      continue;
    const authored = readFileSync(join(root, config), "utf8");
    if (authored.includes(GENERATED_NOTICE)) continue;
    if (!mergesGenerated(tool, authored))
      errors.push(
        refusal(
          "shim_authored",
          config,
          `an authored ${config} sits at the member root and does not import ./.stackra/${tool}.config, so the generated config never loads`,
          `import the generated config and merge it: \`import generated from "./.stackra/${tool}.config"\` and extend it, or delete the file${tool === "vitest" ? " so gen writes the shim" : ""}`,
        ),
      );
    else if (config === ROOT_VITEST_SHIM)
      files = files.filter((file) => file.path !== ROOT_VITEST_SHIM);
  }
  if (errors.length > 0) return { errors, files: [], changed: partial };
  result = { ...result, files };
  return {
    errors: [],
    files: result.files,
    changed: [...new Set([...partial, ...write(root, result.files, check)])],
  };
}
