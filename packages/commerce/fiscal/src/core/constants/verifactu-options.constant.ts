/**
 * Stackra file contract:
 * Purpose: `VERIFACTU_OPTIONS`, the pack options of the `verifactu` driver: the submission and QR endpoints, the record
 *          schema version and namespaces, the invoice type per document kind, the regime key, the operation
 *          qualification per UNCL 5305 category, the operation description, the declared billing system, and the
 *          market's time zone.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `VerifactuDriver`. */
export const VERIFACTU_OPTIONS = z.object({
  /** Where records are submitted. */
  submitUrl: z.url(),
  /** The base URL of the receipt's verification QR code. */
  qrUrl: z.url(),
  /** The record's `IDVersion`. */
  version: z.string().min(1),
  /** The SOAP envelope, submission and record-information namespaces of the schema version. */
  namespaces: z.object({ envelope: z.url(), submission: z.url(), information: z.url() }),
  /** The invoice type per document kind. */
  invoiceTypes: z.object({
    invoice: z.string().min(1),
    simplified: z.string().min(1),
    credit_note: z.string().min(1),
    debit_note: z.string().min(1),
  }),
  /** The VAT regime key (`ClaveRegimen`). */
  regimeKey: z.string().min(1),
  /** The operation qualification per UNCL 5305 category; an exemption code (`E…`) marks the operation exempt. */
  qualifications: z.record(z.string(), z.string().min(1)),
  /** The `DescripcionOperacion` text. */
  operationDescription: z.string().min(1),
  /** The billing system declaration (`SistemaInformatico`). */
  system: z.object({
    producerName: z.string().min(1),
    producerTaxId: z.string().min(1),
    name: z.string().min(1),
    id: z.string().min(1),
    version: z.string().min(1),
    onlyVerifactu: z.string().min(1),
    multipleTaxpayers: z.string().min(1),
    multipleTaxpayersInUse: z.string().min(1),
  }),
  /** IANA time zone of the issue date and the record time. */
  timeZone: z.string().min(1),
});
