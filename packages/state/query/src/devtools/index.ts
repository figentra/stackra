/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./devtools` entry of @stackra/query until `stackra gen` writes the entry barrels
 *          (STA-339): the query devtools tabs.
 * Boundary: names each re-export and declares nothing. Development only: no production path imports it (ADR 0246
 *           decision 1). No Pro import.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0246 (decision 4); ADR 0461.
 */
export { defineQueryDevtools } from "#devtools/functions/define-query-devtools.function";
