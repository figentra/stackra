/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./devtools` entry of @stackra/actions until `stackra gen` writes the entry barrels
 *          (STA-339): the actions devtools tab.
 * Boundary: names each re-export and declares nothing. Development only: no production path imports it (ADR 0246
 *           decision 1). No Pro import.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0246 (decision 4); ADR 0461.
 */
export { defineActionsDevtools } from "#devtools/functions/define-actions-devtools.function";
