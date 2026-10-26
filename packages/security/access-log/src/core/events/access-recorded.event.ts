/**
 * Stackra file contract:
 * Purpose: `AccessRecorded`, the integration event the `outbox` access-log sink writes for every logged access: who
 *          read whose data, through which class and method, in which call, how the class classified it, and when. The
 *          audit service consumes it, chains it per tenant with its other read audits and stores it (ADR 0212).
 * Boundary: an integration event (`access_record.recorded`, version 1). Ids only, never the data that was read (ADR
 *           0134); the actor carries its `onBehalfOf` chain as public ids and kinds, never a credential. It registers
 *           its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1, 3 and 5); ADR 0134; ADR 0141 (the envelope); ADR 0409 (the outbox sink).
 */
import type { Actor, DataClassification } from "@stackra/contracts";
import { DataClassification as Classes, Enum } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * One logged access.
 *
 * @example
 * AccessRecorded.create({ callId, actor, target: "CustomerReads.view", classification: "personal", subjects, at });
 */
export class AccessRecorded extends IntegrationEvent({ name: "access_record.recorded" }) {
  /** The id of the action or query call the access ran in. */
  callId!: string;

  /** Who read, with the delegation chain. */
  actor!: Actor;

  /** `<Class>.<method>` that was called. */
  target!: string;

  /** The data classification the class declared. */
  classification!: DataClassification;

  /** Public ids of the people whose data the call touched. */
  subjects!: string[];

  /** When the access was recorded, ISO 8601. */
  at!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AccessRecorded,
    z.object({
      callId: z.string(),
      actor: z.custom<Actor>((value) => typeof value === "object" && value !== null),
      target: z.string(),
      classification: z.enum(Enum.values(Classes) as [DataClassification, ...DataClassification[]]),
      subjects: z.array(z.string()),
      at: z.string(),
    }),
  ],
]);
