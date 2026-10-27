/**
 * Stackra file contract:
 * Purpose: `EraseSubjectInput`, the input of `EraseSubjectWorkflow`: the erasure request's id, the subject's public
 *          id, and, when another service's workflow waits on this one, the member key to ack as.
 * Boundary: a shape class in its own file; it registers its schema when the module loads (STA-339 replaces the
 *           registration). Who may ask for an erasure is the starting action's permission, not this input's.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2); ADR 0210 (decision 6: service acks); ADR 0294 (decisions 4 and 13);
 *                     STA-1375.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** What an erasure needs. */
export class EraseSubjectInput extends Schema {
  /** The erasure request's id, the receipt's and the ack's subject. */
  @Str({
    min: 1,
    max: 120,
  })
  erasureId!: string;

  /** The public id of the person to erase. */
  @Str({
    min: 1,
    max: 120,
  })
  subject!: string;

  /** The member key this service acks as (`commerce`) when a cross-service erasure waits on it; absent otherwise. */
  @Str({
    min: 1,
    max: 60,
  })
  ackAs?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    EraseSubjectInput,
    z.object({
      erasureId: z.string().min(1).max(120),
      subject: z.string().min(1).max(120),
      ackAs: z.string().min(1).max(60).optional(),
    }),
  ],
]);
