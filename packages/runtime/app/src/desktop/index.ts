/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./desktop` runtime-target entry of @stackra/app (the Electron main-process
 *          `createApp`, the bridge channel and their types), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` through `#core/*`; `.` never imports it.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 8); ADR 0127 2026-10-24 note (runtime-target entries); ADR 0251.
 */
export { BRIDGE_CHANNEL } from "#desktop/constants/bridge-channel.constant";
export { createApp } from "#desktop/functions/create-app.function";
export type { DesktopApp } from "#desktop/types/desktop-app.type";
export type { DesktopAppOptions } from "#desktop/types/desktop-app-options.type";
export type { DesktopDevOptions } from "#desktop/types/desktop-dev-options.type";
