/**
 * Stackra file contract:
 * Purpose: `prepareEncoreService(service, root)`, the fix-up for the two rules `stackra validate --repository` holds a
 *          service to for Encore to build its app at the member root: `dependencies.encore.dev` becomes the default
 *          catalog's literal version, and tsconfig.json gets `baseUrl` "." and `paths` equal to package.json `imports`.
 * Boundary: writes the service's package.json and tsconfig.json, and only when their content changes; a tsconfig's
 *           leading `//` comment lines are kept. Does not touch pnpm-lock.yaml: run `pnpm install` after a pin change.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { catalogEncoreVersion, pathsOfImports, readJsonc } from "@stackra/repo-checks/node";

/**
 * Prepare one service for Encore.
 *
 * @param service - the service member directory.
 * @param root - the workspace root, which holds `pnpm-workspace.yaml`.
 * @throws Error when the default catalog has no `encore.dev` or the service has no package.json.
 * @example
 * prepareEncoreService("/repo/services/orders", "/repo"); // ["package.json", "tsconfig.json"]
 */
export function prepareEncoreService(service: string, root: string): readonly string[] {
  const workspace = join(root, "pnpm-workspace.yaml");
  const version = catalogEncoreVersion(
    existsSync(workspace) ? readFileSync(workspace, "utf8") : undefined,
  );
  if (version === undefined)
    throw new Error("pnpm-workspace.yaml's default catalog has no encore.dev");
  const packageFile = join(service, "package.json");
  if (!existsSync(packageFile)) throw new Error(`${packageFile} not found: run this in a service`);
  const changed: string[] = [];
  const write = (name: string, text: string): void => {
    const file = join(service, name);
    if (existsSync(file) && readFileSync(file, "utf8") === text) return;
    writeFileSync(file, text);
    changed.push(name);
  };

  const pkg = JSON.parse(readFileSync(packageFile, "utf8")) as {
    dependencies?: Record<string, string>;
    imports?: unknown;
  };
  pkg.dependencies = { ...pkg.dependencies, "encore.dev": version };
  write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

  const tsconfigFile = join(service, "tsconfig.json");
  const tsconfig = (existsSync(tsconfigFile) ? readJsonc(tsconfigFile) : {}) as {
    compilerOptions?: Record<string, unknown>;
  };
  const header = existsSync(tsconfigFile)
    ? readFileSync(tsconfigFile, "utf8")
        .split("\n")
        .filter((line) => line.startsWith("//"))
        .map((line) => `${line}\n`)
        .join("")
    : "";
  tsconfig.compilerOptions = {
    ...tsconfig.compilerOptions,
    baseUrl: ".",
    paths: pathsOfImports(pkg.imports),
  };
  write("tsconfig.json", `${header}${JSON.stringify(tsconfig, null, 2)}\n`);
  return changed;
}
