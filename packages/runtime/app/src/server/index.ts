/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./server` runtime-target entry of @stackra/app (the server `createApp`, its app
 *          object, the `Controller` kind for raw HTTP, the `RequestGuard` extension point, and the signed edge-header
 *          guard with its memory drivers and refusal), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` through `#core/*`; `.` never imports it.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 8); ADR 0127 2026-10-24 note (runtime-target entries); registry v3.1 A13;
 *                     ADR 0457 (RequestGuard); ADR 0437 (decision 4: the edge-header guard).
 */
export { Controller } from "#server/bases/controller.base";
export { RequestGuard } from "#server/bases/request-guard.base";
export { MemoryEdgeNonceStoreDriver } from "#server/drivers/memory-edge-nonce-store.driver";
export { MemoryEdgeSigningKeysDriver } from "#server/drivers/memory-edge-signing-keys.driver";
export { AppDrainingError } from "#server/errors/app-draining.error";
export { EdgeSignatureInvalidError } from "#server/errors/edge-signature-invalid.error";
export { createApp } from "#server/functions/create-app.function";
export { EdgeHeaderGuard } from "#server/services/edge-header.guard";
export type { ControllerClass } from "#server/types/controller-class.type";
export type { ControllerOptions } from "#server/types/controller-options.type";
export type { ProbeAnswer } from "#server/types/probe-answer.type";
export type { ServerApp } from "#server/types/server-app.type";
export type { ServerAppOptions } from "#server/types/server-app-options.type";
export type { ServerHandlers } from "#server/types/server-handlers.type";
