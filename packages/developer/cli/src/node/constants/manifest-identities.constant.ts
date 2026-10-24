/**
 * Stackra file contract:
 * Purpose: `MANIFEST_IDENTITIES`, the manifest sections `stackra ls` lists and the field that holds each entry's
 *          derived identity (an action key, an event wire name, a refusal code).
 * Boundary: data only; follows the typed sections of `StackraManifest`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20: derived identities; consequences: `stackra ls <kind>` lists
 *                     declarations from the manifest).
 */

/** Section name to identity field. */
export const MANIFEST_IDENTITIES: Readonly<Record<string, string>> = {
  modules: "key",
  actions: "key",
  events: "name",
  permissions: "key",
  errors: "code",
  models: "key",
  drivers: "key",
};
