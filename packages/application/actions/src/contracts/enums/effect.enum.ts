/**
 * Stackra file contract:
 * Purpose: `Effect`, the effect tags of an action, separate from its risk level: `financial`, `security`, `pii`,
 *          `external_communication`, `irreversible` and `bulk` (one call acts on many records or recipients).
 *          Policies, approval rules and evidence filter on them; `external_communication` with `bulk` is never
 *          bypassable.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Gen registers each action's tags
 *           with its permission (`registerActions`), so the pipeline and every port read them from the call
 *           descriptor; a new tag is an ADR change. Codes are snake_case machine codes (ADR 0231).
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (decision 2, as amended by ADR 0360 decision 10: `bulk`); ADR 0231 (snake_case codes);
 *                     ADR 0294 (the level and tags travel with the permission).
 */
import { Enum } from "@stackra/contracts";

/**
 * The effect tags.
 *
 * @example
 * if (call.effects?.includes(Effect.Bulk) && call.effects.includes(Effect.ExternalCommunication)) requireHuman();
 */
export const Effect = Enum.of({
  /** Moves money or changes what is owed. */
  Financial: "financial",
  /** Changes who may do or see what. */
  Security: "security",
  /** Reads or changes personal data. */
  Pii: "pii",
  /** Sends something outside the system (a message, a webhook, a provider call). */
  ExternalCommunication: "external_communication",
  /** Cannot be undone. */
  Irreversible: "irreversible",
  /** Acts on many records or many recipients in one call. */
  Bulk: "bulk",
});

/** One of the codes above. */
export type Effect = Enum.Value<typeof Effect>;
