/**
 * Stackra file contract:
 * Purpose: `readLicence`, the verified dataset of a Keygen licence file (`{ meta, data, included }`, JSON:API) to a
 *          `Licence`: the licence attributes, the file's issue and expiry times, and the codes of the included
 *          entitlements.
 * Boundary: internal; not exported from the entry. Reads only fields the signed dataset holds and never the licence
 *           key; a dataset without `meta.issued` or `data.id` refuses with `LicenceFileInvalidError` (`malformed`).
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1 and 6, EN6).
 */
import type { Json } from "@stackra/contracts";
import { isRecord } from "@stackra/support";

import { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
import type { Licence } from "#core/types/licence.type";

/** A date field, or `undefined` when it is absent, `null` or not a date. */
function dateOf(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** A limit field, or `undefined` (unlimited) when it is absent or `null`. */
function limitOf(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/**
 * Reads a dataset.
 *
 * @example
 * const licence = readLicence(JSON.parse(new TextDecoder().decode(plaintext)));
 * @throws LicenceFileInvalidError (`malformed`) when the dataset lacks its issue time or licence id.
 */
export function readLicence(dataset: unknown): Licence {
  const meta = isRecord(dataset) ? dataset.meta : undefined;
  const data = isRecord(dataset) ? dataset.data : undefined;
  const issued = isRecord(meta) ? dateOf(meta.issued) : undefined;
  if (!isRecord(meta) || !isRecord(data) || typeof data.id !== "string" || issued === undefined)
    throw LicenceFileInvalidError.create({ reason: "malformed" });
  const attributes = isRecord(data.attributes) ? data.attributes : {};
  const included = isRecord(dataset) && Array.isArray(dataset.included) ? dataset.included : [];
  return {
    id: data.id,
    name: typeof attributes.name === "string" ? attributes.name : undefined,
    status: typeof attributes.status === "string" ? attributes.status : "",
    expiry: dateOf(attributes.expiry),
    issued,
    fileExpiry: dateOf(meta.expiry),
    maxMachines: limitOf(attributes.maxMachines),
    maxUsers: limitOf(attributes.maxUsers),
    entitlements: included.flatMap((resource: unknown) =>
      isRecord(resource) &&
      resource.type === "entitlements" &&
      isRecord(resource.attributes) &&
      typeof resource.attributes.code === "string"
        ? [resource.attributes.code]
        : [],
    ),
    metadata: isRecord(attributes.metadata)
      ? (attributes.metadata as Readonly<Record<string, Json>>)
      : {},
  };
}
