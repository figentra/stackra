/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/gen: discovery on the TypeScript host seam, the `generate`
 *          run (`stackra gen` and `--check`), the docs-site run and its watch (STA-1316) with the docs member reader (ADR 0514 amendment of 2026-11-09), the repo graph step and the system graph merge
 *          (`writeRepoGraph`, `mergeSystemGraphs`, ADR 0452), and the class-component compiler with its Vite plugin
 *          (`classComponents()`, which the generated Vite config imports), until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Node only: it reads files and opens TypeScript.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 26); ADR 0305 (rules 38 to 40); registry v3.1 A14 (gen ships the
 *                     pass, `@stackra/vite-plugin` wires it); the STA-347 stand-in barrel decision; ADR 0452.
 */
export { classComponentsPlugin } from "#node/functions/class-components-plugin.function";
export { classComponents } from "#node/functions/class-components.function";
export { compileClassComponents } from "#node/functions/compile-class-components.function";
export { checkMigrationDrift } from "#node/functions/check-migration-drift.function";
export { compileMigrations } from "#node/functions/compile-migrations.function";
export { discoverMember } from "#node/functions/discover-member.function";
export { generateDocsSite } from "#node/functions/generate-docs-site.function";
export { generate } from "#node/functions/generate.function";
export { isDocsMember } from "#node/functions/is-docs-member.function";
export { mergeSystemGraphs } from "#node/functions/merge-system-graphs.function";
export { openHost } from "#node/functions/open-host.function";
export { readDocsMember } from "#node/functions/read-docs-member.function";
export { readServiceManifests } from "#node/functions/read-service-manifests.function";
export { watchDocsSite } from "#node/functions/watch-docs-site.function";
export { writeRepoGraph } from "#node/functions/write-repo-graph.function";
export type { ClassComponentsPlugin } from "#node/types/class-components-plugin.type";
export type { DocsMember } from "#node/types/docs-member.type";
export type { GenerateResult } from "#node/types/generate-result.type";
export type { MigrationDrift } from "#node/types/migration-drift.type";
export type { ModuleLoader } from "#node/types/module-loader.type";
export type { TsHost } from "#node/types/ts-host.type";
export type { TsSymbol } from "#node/types/ts-symbol.type";
export type { TsType } from "#node/types/ts-type.type";
export type { TsNode } from "#node/types/ts-node.type";
