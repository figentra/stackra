/**
 * Stackra file contract:
 * Purpose: `memberNaming(root, kind, name, scope?)`, the published name and the `@stackra/*` version form of a member
 *          `stackra new` writes. `--scope @acme` names it `@acme/<name>` / `@acme/service-<name>`; `--scope <product>`
 *          or the root runway's `product.key` names it `@figentra/<product>-<name>` /
 *          `@figentra/<product>-service-<name>`; with neither it keeps `@stackra/<name>` / `@figentra/service-<name>`
 *          (the framework and the OS). `@stackra/*` versions are `catalog:stackra` when `pnpm-workspace.yaml`
 *          declares that catalog (a product repository), else `workspace:*` (this repository).
 * Boundary: reads the root `runway.yaml` and `pnpm-workspace.yaml` only; writes nothing. The caller checks the scope.
 * Runtime: node
 * Governing contract: ADR 0349 (decisions 1 to 3: scopes and product package names); ADR 0335 (decision 2: product
 *                     key); ADR 0294 (decision 20: the folder keeps the short name).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import type { TemplateOptions } from "#node/types/template-options.type";

/** A root file parsed as YAML, or undefined when it is absent. */
function readYaml(root: string, file: string): Record<string, unknown> | undefined {
  const path = join(root, file);
  if (!existsSync(path)) return undefined;
  const value: unknown = parse(readFileSync(path, "utf8"));
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * The package name and `@stackra/*` version form of a new member.
 *
 * @param root - the workspace root.
 * @param kind - `package` or `service`.
 * @param name - the kebab-case member name.
 * @param scope - the `--scope` value: `@<npm-scope>` or a product key, already checked.
 * @example
 * memberNaming("/repo", "service", "salon"); // { packageName: "@figentra/beautilon-service-salon", ... } when runway has product.key beautilon
 */
export function memberNaming(
  root: string,
  kind: "package" | "service",
  name: string,
  scope?: string,
): Pick<TemplateOptions, "packageName" | "stackraVersion"> {
  const catalogs = readYaml(root, "pnpm-workspace.yaml")?.["catalogs"];
  const stackraVersion =
    typeof catalogs === "object" && catalogs !== null && "stackra" in catalogs
      ? "catalog:stackra"
      : "workspace:*";
  const member = kind === "service" ? `service-${name}` : name;
  if (scope?.startsWith("@") === true) return { packageName: `${scope}/${member}`, stackraVersion };
  const product = readYaml(root, "runway.yaml")?.["product"];
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
