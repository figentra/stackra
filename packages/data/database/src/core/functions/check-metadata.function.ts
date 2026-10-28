/**
 * Stackra file contract:
 * Purpose: `checkMetadata(model, metadata)`, the write check of `HasMetadata`: a plain object of string values whose
 *          JSON is at most 16 KB (UTF-8).
 * Boundary: internal; pure. Shared by `MetadataSubscriber` (flushes) and `CrudService` (its native `updateWhere` too).
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decision 4: the 16 KB bound); data-layer gap mo18.
 */
import { MetadataInvalidError } from "#core/errors/metadata-invalid.error";

/** The most bytes of JSON one record's metadata may hold (ADR 0321 d4). */
const MAX_BYTES = 16_384;

/**
 * Refuses metadata that is not a bounded string bag.
 *
 * @param model - the entity name, for the refusal.
 * @param metadata - the value being written.
 * @throws MetadataInvalidError when it is not a plain object, a value is not a string, or it exceeds 16 KB.
 * @example
 * checkMetadata("Customer", { crmId: "0031x" }); // passes
 */
export function checkMetadata(model: string, metadata: unknown): void {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata))
    throw MetadataInvalidError.create({ model, reason: "not_object" });
  if (Object.values(metadata).some((value) => typeof value !== "string"))
    throw MetadataInvalidError.create({ model, reason: "value_not_string" });
  if (new TextEncoder().encode(JSON.stringify(metadata)).length > MAX_BYTES)
    throw MetadataInvalidError.create({ model, reason: "too_large" });
}
