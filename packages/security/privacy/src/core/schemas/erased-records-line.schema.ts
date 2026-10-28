/**
 * Stackra file contract:
 * Purpose: `ErasedRecordsLine`, one line of an erasure receipt as a shape: how many rows of one declared model were
 *          deleted, anonymised or shredded. The field type of `SubjectErased.erased` and `EraseSubjectOutput.erased`.
 * Boundary: a shape class implementing the `ErasedRecords` contract, so gen reads the field as a shape
 *           (`shape_unknown_type` otherwise, STA-1299). Counts and kinds only, never ids or contents. It registers its
 *           schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2); ADR 0294 (decisions 4 and 13); STA-1375.
 */
import { Enum } from "@stackra/contracts";
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import type { ErasedRecords } from "#contracts/types/erased-records.type";

/**
 * Rows of one model an erasure disposed of.
 *
 * @example
 * ErasedRecordsLine.create({ kind: "crm.customer", method: ErasureMethod.Delete, count: 1 });
 */
export class ErasedRecordsLine extends Schema implements ErasedRecords {
  /** How many rows. */
  @Int({ min: 0 })
  count!: number;

  /** The model key of the rows (`crm.customer`). */
  kind!: string;

  /** `delete` when the rows were deleted, `anonymise` when edited, `shred` when only the key covers them. */
  method!: ErasureMethod;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ErasedRecordsLine,
    z.object({
      kind: z.string().min(1),
      method: z.enum(Enum.values(ErasureMethod) as [ErasureMethod, ...ErasureMethod[]]),
      count: z.number().int().min(0),
    }),
  ],
]);
