/**
 * Stackra file contract:
 * Purpose: `SubjectErased`, `privacy.subject.erased.v1`: the receipt of one erasure, recorded by the erasure saga's
 *          last step so the audit service and the requester's workflow see what was disposed of, what a legal hold
 *          kept, and whether the subject key was shredded.
 * Boundary: an integration event leaving through the outbox in the step's transaction. Counts and kinds only, never
 *           row ids or contents; the subject's public id identifies the request.
 *           The name is `<aggregate>.<verb>`; gen adds the module key (`event_name_prefixed`, STA-1299).
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2); ADR 0141 (event names); ADR 0305 (rules 19 and 21); STA-1375.
 */
import { Enum } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { KeptRecords$ } from "@stackra/workflow";
import type { KeptRecords } from "@stackra/workflow";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import type { ErasedRecordsLine } from "#core/schemas/erased-records-line.schema";

/**
 * One erasure's receipt, as an event.
 *
 * @example
 * ctx.record(SubjectErased.create({ erasureId, subject, erased, kept, shredded: true, at: ctx.now().toISOString() }));
 */
export class SubjectErased extends IntegrationEvent({ name: "subject.erased" }) {
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
    SubjectErased,
    z.object({
      erasureId: z.string().min(1),
      subject: z.string().min(1),
      erased: z
        .array(
          z.object({
            kind: z.string().min(1),
            method: z.enum(Enum.values(ErasureMethod) as [ErasureMethod, ...ErasureMethod[]]),
            count: z.number().int().min(0),
          }),
        )
        .max(500),
      kept: z.array(KeptRecords$).max(500),
      shredded: z.boolean(),
      at: z.string(),
    }),
  ],
]);
