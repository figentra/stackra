/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/gen: discovery on the TypeScript host seam, the `generate`
 *          run (`stackra gen` and `--check`), the docs-site run and its watch (STA-1316), and the class-component compiler with its Vite plugin
 *          (`classComponents()`, which the generated Vite config imports), until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Node only: it reads files and opens TypeScript.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 26); ADR 0305 (rules 38 to 40); registry v3.1 A14 (gen ships the
 *                     pass, `@stackra/vite-plugin` wires it); the STA-347 stand-in barrel decision.
 */
export { classComponentsPlugin } from "#node/functions/class-components-plugin.function";
export { classComponents } from "#node/functions/class-components.function";
export { compileClassComponents } from "#node/functions/compile-class-components.function";
export { discoverMember } from "#node/functions/discover-member.function";
export { generateDocsSite } from "#node/functions/generate-docs-site.function";
export { generate } from "#node/functions/generate.function";
export { openHost } from "#node/functions/open-host.function";
export { readServiceManifests } from "#node/functions/read-service-manifests.function";
export { watchDocsSite } from "#node/functions/watch-docs-site.function";
export type { ClassComponentsPlugin } from "#node/types/class-components-plugin.type";
export type { GenerateResult } from "#node/types/generate-result.type";
export type { TsHost } from "#node/types/ts-host.type";
export type { TsSymbol } from "#node/types/ts-symbol.type";
export type { TsType } from "#node/types/ts-type.type";
export type { TsNode } from "#node/types/ts-node.type";
