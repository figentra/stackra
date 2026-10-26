/**
 * Stackra file contract:
 * Purpose: `LOADED_SCHEMAS`, the member schema loads of this test process, by member root, so each member's generated
 *          `#stackra/schemas` files are imported once however many testing modules compile.
 * Boundary: module state of the test process, written and read only by `loadMemberSchemas`. Not exported from the
 *           entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0294 (decision 26); registry v3.1 gap G1.
 */

/** Member root to the load of its generated schema files. */
export const LOADED_SCHEMAS = new Map<string, Promise<void>>();
