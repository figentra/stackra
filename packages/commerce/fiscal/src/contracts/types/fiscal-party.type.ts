/**
 * Stackra file contract:
 * Purpose: `FiscalParty`, a seller or buyer on a fiscal document: tax kind, legal name, tax number, a second
 *          registration, address and electronic address.
 * Boundary: a type only. Values come from the host's party and company records; a driver refuses a party that lacks
 *           what its format requires.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8); ADR 0361 (principals and parties).
 */
import type { PartyKind } from "#contracts/enums/party-kind.enum";
import type { FiscalAddress } from "#contracts/types/fiscal-address.type";

/** One party; `taxId` is the VAT or tax registration number. */
export type FiscalParty = {
  /** Business, person or foreign. */
  readonly kind: PartyKind;
  /** Legal (registration) name. */
  readonly name: string;
  /** VAT or tax registration number; `null` for an unregistered person. */
  readonly taxId: string | null;
  /** A second registration (a commercial registration number), with the scheme its format names. */
  readonly registration: { readonly scheme: string; readonly id: string } | null;
  /** Postal address; `null` when none is known. */
  readonly address: FiscalAddress | null;
  /** Electronic address for network delivery (a Peppol participant id), with its scheme. */
  readonly endpoint: { readonly scheme: string; readonly id: string } | null;
};
