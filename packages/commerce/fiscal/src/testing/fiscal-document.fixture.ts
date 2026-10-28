/**
 * Stackra file contract:
 * Purpose: `fiscalDocument`, a consistent sample `FiscalDocument` for tests: two standard-rated lines, one cash tender,
 *          a business seller and buyer with addresses and electronic addresses, totals that add up.
 * Boundary: test data only; the values are samples, not any market's rules (ADR 0363 decision 9). Overrides replace
 *           whole fields, so a test that changes a line also states the totals it expects.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fixtures in the owning package's `./testing`); ADR 0364.
 */
import { Money } from "@stackra/money";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { PartyKind } from "#contracts/enums/party-kind.enum";
import type { FiscalAddress } from "#contracts/types/fiscal-address.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";

/** `minor` cents of EUR. */
const eur = (minor: number) => Money.ofMinor(minor, "EUR");

/**
 * The sample document with `overrides` applied.
 *
 * @example
 * const receipt = fiscalDocument({ kind: FiscalDocumentKind.Simplified, buyer: null });
 */
export function fiscalDocument(overrides: Partial<FiscalDocument> = {}): FiscalDocument {
  const address: FiscalAddress = {
    street: "Main Street",
    buildingNumber: "1",
    district: "Centre",
    city: "Sample City",
    region: "Sample Region",
    postalCode: "12345",
    country: "XX",
    branchId: "0",
  };
  return {
    id: "8d4f2b4e-2c4e-4f53-9a51-3c1d1b0a0001",
    number: "INV-0001",
    kind: FiscalDocumentKind.Invoice,
    issuedAt: new Date("2026-03-01T09:30:00Z"),
    currency: eur(0).currency,
    seller: {
      kind: PartyKind.Business,
      name: "Sample Seller",
      taxId: "TAX-SELLER-1",
      registration: { scheme: "CRN", id: "REG-1" },
      address,
      endpoint: { scheme: "0000", id: "seller-endpoint" },
    },
    buyer: {
      kind: PartyKind.Business,
      name: "Sample Buyer",
      taxId: "TAX-BUYER-1",
      registration: null,
      address,
      endpoint: { scheme: "0000", id: "buyer-endpoint" },
    },
    buyerReference: "PO-1",
    lines: [
      {
        id: "1",
        description: "Widget",
        quantity: 2,
        unitCode: "C62",
        unitPrice: eur(1000),
        net: eur(2000),
        tax: eur(400),
        taxCategory: "S",
        taxRate: "20",
        exemption: null,
        itemCode: { scheme: "GS1", code: "4006381333931" },
      },
      {
        id: "2",
        description: "Book",
        quantity: 1,
        unitCode: "C62",
        unitPrice: eur(1000),
        net: eur(1000),
        tax: eur(100),
        taxCategory: "S",
        taxRate: "10",
        exemption: null,
        itemCode: { scheme: "EGS", code: "EG-1-1" },
      },
    ],
    payments: [{ method: "cash", amount: eur(3500) }],
    net: eur(3000),
    tax: eur(500),
    gross: eur(3500),
    original: null,
    ...overrides,
  };
}
