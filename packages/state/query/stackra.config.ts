/**
 * Stackra file contract:
 * Purpose: the member definition of @stackra/query: static data that gen reads from the syntax tree without running
 *          it. The member key (`query`) is derived from the package name; there is no key option.
 * Boundary: data only; no call other than `definePackage` and no environment read.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 1); ADR 0294 (rule R12); ADR 0127 2026-10-24 note (define* in contracts).
 */
import { definePackage } from "@stackra/contracts";

/** Read by `stackra gen` and `stackra validate`. A package states nothing gen can derive. */
export default definePackage({});
