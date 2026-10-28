/**
 * Stackra file contract:
 * Purpose: `RegistryRoute`: one route of the registry.
 * Boundary: pure; no method check and no lookup (the router does both).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 12 and 14).
 */

/** One route of the registry. */
export type RegistryRoute =
  | {
      readonly kind:
        | "landing"
        | "ping"
        | "whoami"
        | "keys"
        | "login"
        | "catalogue"
        | "entitlements";
    }
  | { readonly kind: "package" | "unpublish" | "exchange" | "catalogueItem"; readonly name: string }
  | { readonly kind: "version"; readonly name: string; readonly spec: string }
  | { readonly kind: "tarball"; readonly name: string; readonly file: string }
  | { readonly kind: "attestations"; readonly name: string; readonly version: string }
  | { readonly kind: "distTags"; readonly name: string; readonly tag: string | null }
  /** The licence API; `rest` is the path after `/-/stackra/v1/licences`, split on `/`. */
  | { readonly kind: "licences"; readonly rest: readonly string[] }
  | { readonly kind: "unknown" };
