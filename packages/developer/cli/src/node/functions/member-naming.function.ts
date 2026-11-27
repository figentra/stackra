/**
 * Stackra file contract:
 * Purpose: `memberNaming(root, kind, name, scope?)`, the published name and the `@stackra/*` version form of a member
 *          `stackra new` writes. `--scope @acme` names it `@acme/<name>` / `@acme/service-<name>`; `--scope <product>`
 *          names it `@figentra/<product>-<name>` / `@figentra/<product>-service-<name>`. Without `--scope`, the
 *          workspace's own npm scope wins: the root package.json `stackra.scope` (`stackra create` writes it), else
 *          the scope of the root package's own name when that is not a first-party scope (`@stackra`,
 *          `@stackra-pro`, `@figentra`). Without either, the root runway's `product.key` names a Figentra product
 *          member `@figentra/<product>-<name>` / `@figentra/<product>-service-<name>`, and with nothing it keeps
 *          `@stackra/<name>` / `@figentra/service-<name>` (the framework and the OS). `@stackra/*` versions are
 *          `catalog:stackra` when `pnpm-workspace.yaml` declares that catalog (a product repository or an app), else
 *          `workspace:*` (this repository).
 * Boundary: reads the root `package.json`, `runway.yaml` and `pnpm-workspace.yaml` only; writes nothing. The caller
 *           checks `--scope`; a root `stackra.scope` that is not an npm scope is refused here.
 * Runtime: node
 * Governing contract: ADR 0349 (decisions 1 to 3: scopes and product package names); ADR 0335 (decision 2: product
 *                     key); ADR 0294 (decision 20: the folder keeps the short name); ADR 0515 (an app made by
 *                     `stackra create` is the user's own, in the scope they chose); STA-2890.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import type { TemplateOptions } from "#node/types/template-options.type";

/** An npm scope, as `stackra create --scope` accepts it. */
const NPM_SCOPE = /^@[a-z0-9][a-z0-9-._~]*$/;

/** The first-party scopes whose member names ADR 0349 fixes; a root package named in one is no workspace scope. */
const FIRST_PARTY = new Set(["@stackra", "@stackra-pro", "@figentra"]);

/** A root file parsed as YAML, or as JSON for a `.json` file; undefined when it is absent. */
function readRootFile(root: string, file: string): Record<string, unknown> | undefined {
  const path = join(root, file);
  if (!existsSync(path)) return undefined;
  const source = readFileSync(path, "utf8");
  const value: unknown = file.endsWith(".json") ? JSON.parse(source) : parse(source);
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * The workspace's own npm scope: the root package.json `stackra.scope`, else its name's scope unless first-party.
 *
 * @throws Error when `stackra.scope` is set but is not an npm scope.
 */
function workspaceScope(root: string): string | undefined {
  const pkg = readRootFile(root, "package.json");
  const stackra = pkg?.["stackra"];
  const declared =
    typeof stackra === "object" && stackra !== null && "scope" in stackra
      ? stackra.scope
      : undefined;
  if (declared !== undefined) {
    if (typeof declared !== "string" || !NPM_SCOPE.test(declared))
      throw new Error(
        `the root package.json stackra.scope must be an npm scope such as @acme, not ${JSON.stringify(declared)}`,
      );
    return declared;
  }
  const name = pkg?.["name"];
  const own = typeof name === "string" ? /^(@[^/]+)\//.exec(name)?.[1] : undefined;
  return own !== undefined && NPM_SCOPE.test(own) && !FIRST_PARTY.has(own) ? own : undefined;
}

/**
 * The package name and `@stackra/*` version form of a new member.
 *
 * @param root - the workspace root.
 * @param kind - `package` or `service`.
 * @param name - the kebab-case member name.
 * @param scope - the `--scope` value: `@<npm-scope>` or a product key, already checked.
 * @throws Error when the root package.json `stackra.scope` is not an npm scope.
 * @example
 * memberNaming("/app", "service", "orders"); // { packageName: "@acme/service-orders", ... } when package.json has stackra.scope @acme
 * memberNaming("/repo", "service", "salon"); // { packageName: "@figentra/velora-service-salon", ... } when runway has product.key velora
 */
export function memberNaming(
  root: string,
  kind: "package" | "service",
  name: string,
  scope?: string,
): Pick<TemplateOptions, "packageName" | "stackraVersion"> {
  const catalogs = readRootFile(root, "pnpm-workspace.yaml")?.["catalogs"];
  const stackraVersion =
    typeof catalogs === "object" && catalogs !== null && "stackra" in catalogs
      ? "catalog:stackra"
      : "workspace:*";
  const member = kind === "service" ? `service-${name}` : name;
  const npmScope =
    scope === undefined ? workspaceScope(root) : scope.startsWith("@") ? scope : undefined;
  if (npmScope !== undefined) return { packageName: `${npmScope}/${member}`, stackraVersion };
  const product = readRootFile(root, "runway.yaml")?.["product"];
  const key =
    scope ??
    (typeof product === "object" && product !== null && "key" in product
      ? String(product.key)
      : undefined);
  if (key !== undefined) return { packageName: `@figentra/${key}-${member}`, stackraVersion };
  return {
    packageName: kind === "service" ? `@figentra/${member}` : `@stackra/${member}`,
    stackraVersion,
  };
}
