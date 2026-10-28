/**
 * Stackra file contract:
 * Purpose: the member definition of @stackra/native-receipt-printer: static data that gen reads from the syntax tree
 *          without running it. The member key (`native-receipt-printer`) is derived from the package name.
 * Boundary: data only; no call other than `definePackage` and no environment read.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 1); ADR 0294 (rule R12); ADR 0478.
 */
import { definePackage } from "@stackra/contracts";

/** Read by `stackra gen` and `stackra validate`. A package states nothing gen can derive. */
export default definePackage({});
