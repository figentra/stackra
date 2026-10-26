/**
 * Stackra file contract:
 * Purpose: `KitStatus`, the status of one version in a kit's `versions.json`: approved and proposed versions are live
 *          designs; rejected, superseded and retired ones are records that stay in `versions/` and are never deleted.
 * Boundary: an `Enum.of` value plus the type of the same name. Which version a product ships is its kit's data.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 6: exploration is archived, never deleted).
 */
import { Enum } from "@stackra/contracts";

/** One case per status a version can hold. */
export const KitStatus = Enum.of({
  /** The owner picked it; its files are the kit root. */
  Approved: "approved",
  /** A candidate still under review. */
  Proposed: "proposed",
  /** A candidate the owner turned down, kept as a record. */
  Rejected: "rejected",
  /** Replaced by a later version, kept as a record. */
  Superseded: "superseded",
  /** An earlier name of the product, kept as a record; it names that earlier name. */
  Retired: "retired",
});

/** One of the codes above. */
export type KitStatus = Enum.Value<typeof KitStatus>;
