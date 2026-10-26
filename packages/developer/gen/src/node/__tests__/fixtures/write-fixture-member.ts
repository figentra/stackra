/**
 * Stackra file contract:
 * Purpose: `writeFixtureMember`, a real member on disk for discovery tests: package.json with its `imports` map and
 *          the `@stackra/*` dependencies generated files import, a
 *          tsconfig with decorators on, `stackra.config.ts`, the given source files, and local stand-in packages
 *          (`@stackra/actions`, `@stackra/events`, `@stackra/outbox`) for the kind bases and types whose packages are
 *          not gen's dependencies, with `ReplicaPage` (ADR 0338) for a replica query's output, `Listener` and the
 *          relay's `EventEnvelope` (ADR 0260 decision 4). The real
 *          `@stackra/*` packages resolve through gen's own node_modules.
 * Boundary: test data only; writes under `<gen>/.cache/fixtures/` (gitignored) and never elsewhere.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 15 and 16).
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/** Counts the members this process wrote, so parallel tests never share a folder. */
let written = 0;

/** The stand-in kind bases of packages that do not ship yet. */
const STAND_INS: Readonly<Record<string, string>> = {
  "node_modules/@stackra/actions/package.json": JSON.stringify({
    name: "@stackra/actions",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/actions/index.d.ts": [
    'export declare abstract class ActionBase { protected readonly "~kind": "action"; }',
    'export declare abstract class QueryBase { protected readonly "~kind": "query"; }',
    "export declare function Action(options: { readonly key: string; readonly [option: string]: unknown }): abstract new () => ActionBase;",
    "export declare function Query(options: { readonly key: string; readonly [option: string]: unknown }): abstract new () => QueryBase;",
    "export interface ReplicaPage<T = unknown> { readonly rows: readonly T[]; readonly removed: readonly string[]; readonly cursor: string; readonly asOf: Date; readonly full: boolean }",
    "export declare abstract class Permissions {}",
    'export declare const Permission: { readonly L0: "L0"; readonly L1: "L1"; readonly L2: "L2"; readonly L3: "L3"; readonly L4: "L4" };',
    "",
  ].join("\n"),
  "node_modules/@stackra/events/package.json": JSON.stringify({
    name: "@stackra/events",
    types: "./index.d.ts",
  }),
  "node_modules/@stackra/events/index.d.ts": [
    "export declare abstract class Event {}",
    "export declare abstract class DomainEvent extends Event {}",
    "export declare function IntegrationEvent(options: { readonly name: string; readonly [option: string]: unknown }): abstract new () => Event;",
    "export declare abstract class Listener { abstract handle(event: never, ctx: unknown): Promise<void>; }",
    "",
  ].join("\n"),
  "node_modules/@stackra/outbox/package.json": JSON.stringify({
    name: "@stackra/outbox",
    exports: { ".": { types: "./index.d.ts" }, "./contracts": { types: "./index.d.ts" } },
  }),
  "node_modules/@stackra/outbox/index.d.ts":
    "export interface EventEnvelope { readonly id: string; readonly type: string; readonly data: unknown }\n",
};

/**
 * Writes a fixture member and returns its root.
 *
 * @param name - the member folder name (its key is the snake_case of it).
 * @param files - path (relative to the member root) to content; `stackra.config.ts` and `package.json` may be given.
 * @example
 * const root = writeFixtureMember("shop", { "src/core/schemas/x.schema.ts": "..." });
 */
export function writeFixtureMember(name: string, files: Readonly<Record<string, string>>): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "fixtures", `${process.pid}-${written}`, name);
  rmSync(root, { recursive: true, force: true });
  const folders = ["config", "contracts", "core", "node", "react", "native", "testing", "modules"];
  const all: Record<string, string> = {
    "package.json": JSON.stringify({
      name: `@fixture/${name}`,
      version: "1.0.0",
      type: "module",
      // What the generated schemas and clients import, so gen's undeclared-package refusals stay quiet.
      dependencies: Object.fromEntries(
        ["clients", "contracts", "errors", "money", "validation"].map((name) => [
          `@stackra/${name}`,
          "workspace:*",
        ]),
      ),
      imports: Object.fromEntries(
        folders.map((folder) => [
          `#${folder}/*`,
          [`./src/${folder}/*.ts`, `./src/${folder}/*.tsx`],
        ]),
      ),
    }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        customConditions: ["@stackra/source"],
        strict: true,
        exactOptionalPropertyTypes: true,
        experimentalDecorators: true,
        useDefineForClassFields: true,
        skipLibCheck: true,
        noEmit: true,
        jsx: "react-jsx",
        types: [],
      },
      include: ["src"],
    }),
    "stackra.config.ts":
      'import { definePackage } from "@stackra/contracts";\n\nexport default definePackage({});\n',
    ...STAND_INS,
    ...files,
  };
  for (const [path, content] of Object.entries(all)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}
