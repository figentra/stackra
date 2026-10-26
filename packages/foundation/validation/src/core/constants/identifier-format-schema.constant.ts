/**
 * Stackra file contract:
 * Purpose: `IDENTIFIER_FORMAT_SCHEMA`, the shipped `IdentifierFormat$`: parses a market-pack value (`identity.*`) into
 *          an `IdentifierFormat`, so a caller hands `identifier()` a checked format instead of casting `unknown`, and a
 *          pack's section schema can declare the key with `z.toJSONSchema(IdentifierFormat$)`.
 * Boundary: shape only. A pattern that is not a valid regular expression is refused here, so a bad pack value fails
 *           the pack check (`value_invalid`) rather than throwing inside `checkIdentifier`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0417 (section schemas); owner
 *                     principle 2026-10-25 (configuration, not code); STA-1269.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { IdentifierCheck } from "#core/enums/identifier-check.enum";
import type { IdentifierFormat } from "#core/types/identifier-format.type";

/** Whether `source` compiles as a regular expression. */
function compiles(source: string): boolean {
  try {
    return new RegExp(source) instanceof RegExp;
  } catch {
    return false;
  }
}

/** The shipped `IdentifierFormat$`. */
export const IDENTIFIER_FORMAT_SCHEMA: z.ZodType<IdentifierFormat> = z.object({
  pattern: z.string().min(1).refine(compiles, "Expected a valid regular expression"),
  check: z.enum(Enum.values(IdentifierCheck)).exactOptional(),
  canonical: z.string().min(1).exactOptional(),
}) as unknown as z.ZodType<IdentifierFormat>;
