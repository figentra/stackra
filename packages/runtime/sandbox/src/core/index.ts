/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/sandbox (the `Sandbox` service, its two refusals and the request,
 *          language, limits and result types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The fetch proxy port and its request and response types are
 *           `./contracts`'.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { SandboxCodeFailedError } from "#core/errors/sandbox-code-failed.error";
export { SandboxLimitExceededError } from "#core/errors/sandbox-limit-exceeded.error";
export { Sandbox } from "#core/services/sandbox.service";
export type { SandboxLanguage } from "#core/types/sandbox-language.type";
export type { SandboxLimit } from "#core/types/sandbox-limit.type";
export type { SandboxLimits } from "#core/types/sandbox-limits.type";
export type { SandboxRequest } from "#core/types/sandbox-request.type";
export type { SandboxResult } from "#core/types/sandbox-result.type";
