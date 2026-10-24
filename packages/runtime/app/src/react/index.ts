/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/app (the client contexts every React target mounts, and
 *          the registration a client package names its context with), until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` through `#core/*`; `.` never imports it. The
 *           context registry and the built-in `i18n` context stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0295 (decision 10); the STA-347 stand-in barrel decision.
 */
export { Contexts } from "#react/contexts/contexts";
export { registerContext } from "#react/contexts/register-context";
export type { ContextComponent } from "#react/contexts/context-component.type";
export type { ContextProps } from "#react/contexts/context-props.type";
export type { ContextsProps } from "#react/contexts/contexts-props.type";
