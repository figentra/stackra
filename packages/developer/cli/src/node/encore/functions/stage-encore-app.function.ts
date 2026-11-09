/**
 * Stackra file contract:
 * Purpose: `stageEncoreApp(root)`, the staging copy a repository with several services builds as one Encore app: under
 *          `.stackra/encore-app/` it copies every service (`services/<name>` with a generated `encore.app`) and every
 *          workspace package they reach through `workspace:` dependencies, rewrites each copy's `#` imports as relative
 *          paths, and writes the app root Encore reads: `encore.app` (the services' one app id), a package.json that
 *          pins `encore.dev` to the default catalog's version, a tsconfig.json whose `paths` map each staged package
 *          name and subpath to its staged source, and a pnpm-workspace.yaml of its own.
 * Boundary: Encore ignores package.json `imports` and reads `paths` only from the app root's own tsconfig (ADR 0091,
 *           amendment of 2026-11-09), so no `#` specifier may reach it: one the member's `imports` cannot resolve is
 *           left as written and returned in `unresolved`. A copy holds `src/`, `.stackra/`, `assets/` and package.json,
 *           never a member's `encore.app`, `node_modules` or `dist`; each copy's `node_modules` is a link to the
 *           member's own, so third-party packages resolve as they do in the workspace, while workspace packages resolve
 *           through `paths` to their staged, rewritten source (the `@stackra/source` export condition). The staging
 *           folder is replaced whole on every run and is gitignored with `.stackra/`. Its own pnpm-workspace.yaml keeps
 *           the install Encore runs before it parses inside the folder, never in the repository's workspace.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: multi-service apps, option b); ADR 0029 (one
 *                     Encore app); ADR 0233 (`#` imports).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

import { catalogEncoreVersion } from "@stackra/repo-checks/node";

import { ENCORE_STAGE } from "#node/encore/constants/encore-stage.constant";
import { resolveImportAlias } from "#node/encore/functions/resolve-import-alias.function";
import { rewriteHashImports } from "#node/encore/functions/rewrite-hash-imports.function";
import type { StagedEncoreApp } from "#node/encore/types/staged-encore-app.type";

/** What a member's copy holds. */
const COPIED = ["src", ".stackra", "assets", "package.json"] as const;

/** The export condition that names a workspace package's source. */
const SOURCE_CONDITION = "@stackra/source";

/** A workspace member's package.json, as far as staging reads it. */
type MemberManifest = {
  readonly name?: string;
  readonly imports?: Readonly<Record<string, unknown>>;
  readonly exports?: unknown;
  readonly dependencies?: Readonly<Record<string, string>>;
};

/** One workspace member. */
type Member = { readonly dir: string; readonly manifest: MemberManifest };

const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();

const isDirectory = (path: string): boolean => existsSync(path) && statSync(path).isDirectory();

const readManifest = (dir: string): MemberManifest =>
  JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as MemberManifest;

/** The member folders one level (`services/*`) or two levels (`packages/<category>/*`) below `base`. */
function memberDirs(base: string, depth: 1 | 2): string[] {
  if (!isDirectory(base)) return [];
  const children = readdirSync(base)
    .toSorted()
    .map((name) => join(base, name))
    .filter(isDirectory);
  return depth === 1
    ? children.filter((dir) => isFile(join(dir, "package.json")))
    : children.flatMap((dir) => memberDirs(dir, 1));
}

/** Every `.ts` and `.tsx` file below `dir`, `node_modules` excluded. */
function sourceFiles(dir: string): string[] {
  if (!isDirectory(dir)) return [];
  return readdirSync(dir)
    .toSorted()
    .flatMap((name) => {
      if (name === "node_modules") return [];
      const path = join(dir, name);
      if (isDirectory(path)) return sourceFiles(path);
      return /\.tsx?$/.test(name) ? [path] : [];
    });
}

/** The `paths` entries of a staged package: its name and each export subpath, to the staged source. */
function pathsOfExports(name: string, staged: string, exports: unknown): [string, string[]][] {
  const entries: [string, string[]][] = [];
  const add = (subpath: string, target: unknown) => {
    const file =
      typeof target === "string"
        ? target
        : typeof target === "object" && target !== null
          ? (target as Record<string, unknown>)[SOURCE_CONDITION]
          : undefined;
    if (typeof file !== "string") return;
    const key = subpath === "." ? name : `${name}/${subpath.replace(/^\.\//, "")}`;
    entries.push([key, [`./${join(staged, file)}`]]);
  };
  if (typeof exports === "string") add(".", exports);
  else if (typeof exports === "object" && exports !== null)
    for (const [subpath, target] of Object.entries(exports)) add(subpath, target);
  return entries;
}

/**
 * Stage the repository's services as one Encore app.
 *
 * @param root - the repository root, which holds `pnpm-workspace.yaml`.
 * @returns what was staged, and any `#` specifier left unresolved.
 * @throws Error when the default catalog has no `encore.dev`, no service has a generated `encore.app` (run
 *         `stackra gen` first), or two services name different apps.
 * @example
 * stageEncoreApp("/repo"); // { out: "/repo/.stackra/encore-app", services: ["services/orders", …], … }
 */
export function stageEncoreApp(root: string): StagedEncoreApp {
  const workspace = join(root, "pnpm-workspace.yaml");
  const version = catalogEncoreVersion(
    isFile(workspace) ? readFileSync(workspace, "utf8") : undefined,
  );
  if (version === undefined)
    throw new Error("pnpm-workspace.yaml's default catalog has no encore.dev");

  const services = memberDirs(join(root, "services"), 1).filter((dir) =>
    isFile(join(dir, "encore.app")),
  );
  if (services.length === 0)
    throw new Error("no service has a generated encore.app: run stackra gen in each service first");
  const apps = new Set(services.map((dir) => readFileSync(join(dir, "encore.app"), "utf8")));
  if (apps.size > 1)
    throw new Error(
      `the services name ${apps.size} different Encore apps; one app needs one providers.encore.app`,
    );

  const byName = new Map<string, Member>();
  for (const dir of [...services, ...memberDirs(join(root, "packages"), 2)]) {
    const manifest = readManifest(dir);
    if (manifest.name !== undefined) byName.set(manifest.name, { dir, manifest });
  }
  // The services and the workspace packages they reach, in a stable order.
  const staged = new Map<string, Member>();
  const visit = (member: Member) => {
    if (staged.has(member.dir)) return;
    staged.set(member.dir, member);
    for (const [name, spec] of Object.entries(member.manifest.dependencies ?? {})) {
      const dependency = byName.get(name);
      if (spec.startsWith("workspace:") && dependency !== undefined) visit(dependency);
    }
  };
  for (const dir of services) visit({ dir, manifest: readManifest(dir) });

  const out = join(root, ENCORE_STAGE);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const paths: Record<string, string[]> = {};
  const unresolved: { file: string; specifier: string }[] = [];
  let rewritten = 0;
  for (const { dir, manifest } of staged.values()) {
    const rel = relative(root, dir);
    const copy = join(out, rel);
    mkdirSync(copy, { recursive: true });
    for (const entry of COPIED) {
      const from = join(dir, entry);
      if (!existsSync(from)) continue;
      cpSync(from, join(copy, entry), {
        recursive: true,
        filter: (source) => !/(^|[/\\])(node_modules|dist)([/\\]|$)/.test(relative(dir, source)),
      });
    }
    if (isDirectory(join(dir, "node_modules")))
      symlinkSync(join(dir, "node_modules"), join(copy, "node_modules"), "dir");
    if (!services.includes(dir) && manifest.name !== undefined)
      for (const [key, value] of pathsOfExports(manifest.name, rel, manifest.exports))
        paths[key] = value;

    const imports = manifest.imports ?? {};
    for (const file of sourceFiles(copy)) {
      const text = readFileSync(file, "utf8");
      const result = rewriteHashImports(text, file, (specifier) =>
        resolveImportAlias(copy, imports, specifier, isFile),
      );
      for (const specifier of result.unresolved)
        unresolved.push({ file: relative(out, file), specifier });
      if (result.text !== text) {
        writeFileSync(file, result.text);
        rewritten += 1;
      }
    }
  }

  const [app] = apps;
  writeFileSync(join(out, "encore.app"), app ?? "");
  const write = (name: string, value: unknown) =>
    writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`);
  write("package.json", {
    name: "stackra-encore-app",
    private: true,
    type: "module",
    dependencies: { "encore.dev": version },
  });
  write("tsconfig.json", { compilerOptions: { baseUrl: ".", paths } });
  writeFileSync(join(out, "pnpm-workspace.yaml"), "packages:\n  - .\n");
  return {
    out,
    services: services.map((dir) => relative(root, dir)),
    packages: [...staged.keys()]
      .filter((dir) => !services.includes(dir))
      .map((dir) => relative(root, dir)),
    rewritten,
    unresolved,
  };
}
