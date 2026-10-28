/**
 * Stackra file contract:
 * Purpose: `EraseSubjectOutput`, the output of `EraseSubjectWorkflow` and `EraseSubjectAction`: the erasure receipt
 *          (what was disposed of per model, what a legal hold kept, whether the subject key was shredded).
 * Boundary: a shape class implementing `ErasureReceipt`; it registers its schema when the module loads (STA-339
 *           replaces the registration). `erased` is typed with the `ErasedRecordsLine` shape (STA-1299). Counts and
 *           kinds only, never row ids or contents.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2); ADR 0294 (decisions 4 and 13); STA-1375.
 */
import { Enum } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";
import { KeptRecords$ } from "@stackra/workflow";
import type { KeptRecords } from "@stackra/workflow";
import { z } from "zod";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import type { ErasureReceipt } from "#contracts/types/erasure-receipt.type";
import type { ErasedRecordsLine } from "#core/schemas/erased-records-line.schema";

/** An erasure's receipt. */
export class EraseSubjectOutput extends Schema implements ErasureReceipt {
  /** The erasure request's id. */
  erasureId!: string;

  /** The erased subject's public id. */
  subject!: string;

  /** What was disposed of, per model. */
  erased!: ErasedRecordsLine[];

  /** What a legal hold kept, per model. */
  kept!: KeptRecords[];

  /** Whether the subject key's salt was destroyed. */
  shredded!: boolean;

  /** When the erasure finished, ISO 8601. */
  at!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    EraseSubjectOutput,
    z.object({
      erasureId: z.string().min(1),
      subject: z.string().min(1),
      erased: z.array(
        z.object({
          kind: z.string().min(1),
          method: z.enum(Enum.values(ErasureMethod) as [ErasureMethod, ...ErasureMethod[]]),
          count: z.number().int().min(0),
        }),
      ),
      kept: z.array(KeptRecords$),
      shredded: z.boolean(),
      at: z.string(),
    }),
  ],
]);
