/**
 * Stackra file contract:
 * Purpose: `AwardPassSource`, what the award pass is built from: the award's certificate fields
 *          (`AwardService#certificateOf`) without the print template and the SVG QR code, plus the brand kit's
 *          colours and logo.
 * Boundary: a type only. The recipient's name is not on it: a pass shows only what a lock screen may show (ADR 0348
 *           decision 5), and the verify link carries the rest. The brand is tenant data, never code.
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5); ADR 0368 (decision 6); ADR 0432 (decisions 2 and 4).
 */
import type { PassContent } from "@stackra/integrations";

import type { CertificateFields } from "#contracts/types/certificate-fields.type";

/** The values of one award pass. */
export type AwardPassSource = Omit<CertificateFields, "template" | "verifyQr"> & {
  /** The brand kit's colours and logo. */
  readonly brand?: Pick<PassContent, "colors" | "logo">;
};
