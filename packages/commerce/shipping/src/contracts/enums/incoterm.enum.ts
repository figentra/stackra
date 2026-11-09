/**
 * Stackra file contract:
 * Purpose: `Incoterm`, who pays the import duties and taxes of a cross-border shipment: the buyer on delivery (DAP) or
 *          the shipper up front (DDP).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Absent on a request, the carrier's
 *           default applies (DAP for parcels). A connector that cannot honour DDP for a destination refuses with
 *           `ddp_unsupported`; it never books or quotes DAP in its place. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0369; Incoterms 2020 (DAP, DDP).
 */
import { Enum } from "@stackra/contracts";

/**
 * Who pays a cross-border shipment's duties and taxes.
 *
 * @example
 * const quotes = await gateway.quote({ ...request, incoterm: Incoterm.Ddp });
 */
export const Incoterm = Enum.of({
  /** Delivered at place: the buyer pays duties and import taxes on delivery. */
  Dap: "dap",
  /** Delivered duty paid: the shipper pays them, and the buyer pays nothing more. */
  Ddp: "ddp",
});

/** One of the codes above. */
export type Incoterm = Enum.Value<typeof Incoterm>;
