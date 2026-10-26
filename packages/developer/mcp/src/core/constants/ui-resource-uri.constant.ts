/**
 * Stackra file contract:
 * Purpose: `UI_RESOURCE_URI`, the shape of a `ui://` resource URI: `ui://<module>/<name>`, both snake or kebab case.
 * Boundary: a pattern; a resource or a tool naming any other URI is left out of the tables, never served.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); STA-784.
 */

/** `ui://<module>/<name>`. */
export const UI_RESOURCE_URI = /^ui:\/\/[a-z][a-z0-9_-]*\/[a-z][a-z0-9_-]*$/;
