/**
 * Stackra file contract:
 * Purpose: `BlockKind`, what a building block is to an automation: a trigger (an event that starts it or that a step
 *          waits for) or an action (a registered action a step calls).
 * Boundary: an `Enum.of` value plus the type of the same name. Conditions are `@stackra/rules` conditions over a
 *           trigger's facts, so they are not blocks of their own.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 1: every package exposes building blocks); ADR 0122 (decision 3: triggers,
 *                     conditions and actions); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The kind of a building block. */
export const BlockKind = Enum.of({
  /** An event class: it starts an automation, and a step may wait for it. */
  Trigger: "trigger",
  /** An action class: a step calls it through the action pipeline. */
  Action: "action",
});

/** One of the codes above. */
export type BlockKind = Enum.Value<typeof BlockKind>;
