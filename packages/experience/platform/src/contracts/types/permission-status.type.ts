/**
 * Stackra file contract:
 * Purpose: `PermissionStatus`, where an operating-system or browser permission stands: granted, denied, or not asked
 *          yet. Every capability facet that needs a permission reports and returns it.
 * Boundary: a type only, spelled as the Permissions API spells it (`PermissionState`), a tool-owned value; a native
 *           driver maps its own status (`undetermined`) onto `prompt`.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2: ports per capability); ADR 0231 (tool-owned values keep their spelling).
 */

/** A permission: granted, denied, or still to be asked. */
export type PermissionStatus = "granted" | "denied" | "prompt";
