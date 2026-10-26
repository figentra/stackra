/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/sandbox (the process-isolated `SandboxPool`, the body of its
 *          processes, and the TypeScript step compiler) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Node only: child processes and Node's type stripping. The IPC
 *           fetch proxy and the pool's message types stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0434 (decisions 2 and 3); the STA-347 stand-in barrel decision.
 */
export { compileTypeScriptStep } from "#node/functions/compile-typescript-step.function";
export { serveSandboxChild } from "#node/functions/serve-sandbox-child.function";
export { SandboxPool } from "#node/services/sandbox-pool.service";
export type { SandboxPoolOptions } from "#node/types/sandbox-pool-options.type";
