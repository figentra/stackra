/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/console, the process binding (`nodePorts`) and the
 *          terminal prompter, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { nodePorts } from "#node/functions/node-ports.function";
export { tarballSpecs } from "#node/functions/tarball-specs.function";
export { terminalPrompter } from "#node/functions/terminal-prompter.function";
