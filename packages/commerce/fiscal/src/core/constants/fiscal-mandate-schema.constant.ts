/**
 * Stackra file contract:
 * Purpose: `FISCAL_MANDATE_SCHEMA`, the check the market-pack binding runs on the value of `fiscal.invoice` and
 *          `fiscal.till` before answering it as a `FiscalMandate`.
 * Boundary: a zod schema constant: shape only. `options` stays an open record that the named driver parses with its
 *           own schema; the two floors are required and may be `null`, so a pack that leaves one out is refused
 *           instead of falling back to a value in code. `checkDocument` is optional: a pack without it simply has no
 *           guest-check mode, and `FiscalService.sealCheck` refuses then.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 2) as amended by ADR 0385; ADR 0363 (decisions 3 and 4).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { CheckDocumentMode } from "#contracts/enums/check-document-mode.enum";

/** The pack value of one fiscal channel. */
export const FISCAL_MANDATE_SCHEMA = z.object({
  driver: z.string().min(1),
  options: z.record(z.string(), z.unknown()),
  reportingWindowHours: z.number().positive().nullable(),
  retentionYears: z.number().positive().nullable(),
  checkDocument: z.enum(Enum.values(CheckDocumentMode)).exactOptional(),
});
