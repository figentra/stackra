/**
 * Stackra file contract:
 * Purpose: `encoreServiceFolder(member)`, the folder of one generated Encore service relative to its member root
 *          (`stackra-encore/<member>`), which every Encore emitter writes into.
 * Boundary: pure; the folder name is `ENCORE_SERVICES_DIR`.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2 as amended 2026-11-10).
 */
import { ENCORE_SERVICES_DIR } from "#core/constants/encore-services-dir.constant";

/**
 * The generated Encore service folder of `member`, relative to the member root.
 *
 * @param member - the member key.
 * @example
 * encoreServiceFolder("shop"); // "stackra-encore/shop"
 */
export function encoreServiceFolder(member: string): string {
  return `${ENCORE_SERVICES_DIR}/${member}`;
}
