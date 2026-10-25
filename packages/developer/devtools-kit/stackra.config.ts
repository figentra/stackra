/**
 * Stackra file contract:
 * Purpose: the member definition of @stackra/devtools-kit: static data that gen reads from the syntax tree without
 *          running it. The member key (`devtools-kit`) is derived from the folder name; there is no key option.
 * Boundary: data only; no call other than `definePackage` and no environment read.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 1); ADR 0294 (rule R12); ADR 0127 2026-10-24 note (devtools-kit in
 *                     developer); ADR 0246.
 */
import { definePackage } from "@stackra/contracts";

/** Read by `stackra gen` and `stackra validate`. A package states nothing gen can derive. */
export default definePackage({});
