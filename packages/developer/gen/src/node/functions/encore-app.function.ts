/**
 * Stackra file contract:
 * Purpose: `encoreApp`, the Encore app file step of a gen run: for a service, `.stackra/encore/encore.app` with the id
 *          the root runway names at `providers.encore.app`; for every member, the refusal of a stray `encore.app` at
 *          the member root or the repository root (`encore_app_stray`). A service whose root runway names no app id is
 *          refused as `encore_app_missing`, never given a default id.
 * Boundary: reads only; `generate` writes the file (when its content changes) or reports the refusals. The repository
 *           root is the nearest folder above the member that holds `pnpm-workspace.yaml`, as `@stackra/runway` finds
 *           it. The root runway is read by a small block-YAML lookup, not by `readRunway`, since gen does not depend on
 *           `@stackra/runway`; the root runway is block style (`checkYamlFlowMaps`), which the lookup relies on.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2: encore.app is generated into `.stackra/encore`); ADR 0029 (one Encore app,
 *                     never outside the generated app); ADR 0296 (decision 2: one root runway); STA-1322.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { emitEncoreApp } from "#core/functions/emit-encore-app.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** The Encore app file name, and the runway key that holds its id. */
const ENCORE_APP = "encore.app";
const APP_KEY = ["providers", "encore", "app"] as const;

/** One whole-file refusal, its file relative to the member root. */
const refusal = (code: string, file: string, message: string, fix: string): GenError => ({
  code,
  file,
  line: 0,
  column: 0,
  subject: file,
  message,
  fix,
});

/** The repository root above `root` (the nearest folder with `pnpm-workspace.yaml`), or undefined. */
function repositoryRootOf(root: string): string | undefined {
  for (let directory = root; ; directory = dirname(directory)) {
    if (existsSync(join(directory, "pnpm-workspace.yaml"))) return directory;
    if (dirname(directory) === directory) return undefined;
  }
}

/** A YAML scalar without its quotes. */
const unquote = (value: string): string => value.replace(/^(["'])(.*)\1$/, "$2");

/**
 * The scalar at `path` in a block-style YAML document, or undefined when a key on the way is missing or the value is
 * not a scalar on the key's line.
 * shortcut: block style only (no flow maps, anchors or multi-line scalars on the path); switch to `readRunway` from
 * `@stackra/runway` once gen depends on it (an integration-batch lockfile change).
 */
function yamlScalar(source: string, path: readonly string[]): string | undefined {
  let depth = 0;
  let parent = -1;
  let child: number | undefined;
  for (const raw of source.split(/\r?\n/)) {
    const line = /^( *)("[^"]*"|'[^']*'|[^\s"'#:][^:#]*?):(?:\s+(.*?))?\s*$/.exec(
      raw.replace(/(^|\s)#.*$/, ""),
    );
    if (line === null) continue;
    const [, spaces = "", key = "", value] = line;
    const indent = spaces.length;
    if (indent <= parent) return undefined;
    child ??= indent;
    if (indent !== child || unquote(key) !== path[depth]) continue;
    if (depth === path.length - 1) {
      return value === undefined || value === "" ? undefined : unquote(value);
    }
    depth += 1;
    parent = indent;
    child = undefined;
  }
  return undefined;
}

/**
 * The Encore app file of the member at `root` and the refusals around it.
 *
 * @param root - the member root.
 * @param service - whether the member is a service in a full run, the only case that writes the app file.
 * @example
 * encoreApp("services/sales", true).files[0]?.path; // ".stackra/encore/encore.app"
 */
export function encoreApp(
  root: string,
  service: boolean,
): { readonly errors: GenError[]; readonly files: GeneratedFile[] } {
  const repository = repositoryRootOf(root);
  const errors = [...new Set([root, ...(repository === undefined ? [] : [repository])])]
    .map((folder) => join(folder, ENCORE_APP))
    .filter((file) => existsSync(file))
    .map((file) =>
      refusal(
        "encore_app_stray",
        relative(root, file),
        `${relative(root, file)} sits outside the generated Encore app: gen writes the only encore.app, into .stackra/encore`,
        `delete ${relative(root, file)} and set the app id at \`${APP_KEY.join(".")}\` in the root runway.yaml`,
      ),
    );
  if (!service) return { errors, files: [] };
  const runway = repository === undefined ? undefined : join(repository, "runway.yaml");
  const id =
    runway !== undefined && existsSync(runway)
      ? yamlScalar(readFileSync(runway, "utf8"), APP_KEY)
      : undefined;
  if (id === undefined) {
    const file = runway === undefined ? "runway.yaml" : relative(root, runway);
    errors.push(
      refusal(
        "encore_app_missing",
        file,
        `the root runway names no Encore app id at \`${APP_KEY.join(".")}\`, so gen cannot write .stackra/encore/encore.app`,
        `set \`${APP_KEY.join(".")}\` in ${file} to the Encore Cloud app id (for example \`app: figentra-commerce\`)`,
      ),
    );
    return { errors, files: [] };
  }
  return { errors, files: [emitEncoreApp(id)] };
}
