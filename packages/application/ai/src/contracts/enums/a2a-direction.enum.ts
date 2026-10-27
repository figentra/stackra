/**
 * Stackra file contract:
 * Purpose: `A2aDirection`, which way one agent-to-agent task runs: `inbound` (a remote agent asked us) or `outbound`
 *          (we asked a remote agent).
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231), stored in `ai.a2a_tasks.direction`.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 7 and 10: `a2a_tasks`); ADR 0399; ADR 0294 (decision 16: `Enum.of`).
 */
import { Enum } from "@stackra/contracts";

/**
 * An A2A task's direction.
 *
 * @example
 * if (task.direction === A2aDirection.Inbound) answer(task);
 */
export const A2aDirection = Enum.of({
  /** A remote agent asked us. */
  Inbound: "inbound",
  /** We asked a remote agent. */
  Outbound: "outbound",
});

/** One of the codes above. */
export type A2aDirection = Enum.Value<typeof A2aDirection>;
