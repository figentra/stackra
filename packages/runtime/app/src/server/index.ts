/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./server` runtime-target entry of @stackra/app (the server `createApp`, its app
 *          object and the `Controller` kind for raw HTTP), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` through `#core/*`; `.` never imports it.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 8); ADR 0127 2026-10-24 note (runtime-target entries); registry v3.1 A13.
 */
export { Controller } from "#server/bases/controller.base";
export { AppDrainingError } from "#server/errors/app-draining.error";
export { createApp } from "#server/functions/create-app.function";
export type { ControllerClass } from "#server/types/controller-class.type";
export type { ControllerOptions } from "#server/types/controller-options.type";
export type { ProbeAnswer } from "#server/types/probe-answer.type";
export type { ServerApp } from "#server/types/server-app.type";
export type { ServerAppOptions } from "#server/types/server-app-options.type";
export type { ServerHandlers } from "#server/types/server-handlers.type";
