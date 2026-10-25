/**
 * Stackra file contract:
 * Purpose: the former home of the `EntitlementSource` port, kept so `import { EntitlementSource } from
 *          "@stackra/entitlements"` and `#core/ports/entitlement-source.port` keep working.
 * Boundary: re-exports the port that now lives in `./contracts` (the row "`EntitlementSource` to contracts"); it
 *           declares nothing, so both imports name the same class and token.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); owner round 3 #18; keep the public API working.
 */
export { EntitlementSource } from "#contracts/ports/entitlement-source.port";
