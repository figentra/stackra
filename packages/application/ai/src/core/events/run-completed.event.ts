/**
 * Stackra file contract:
 * Purpose: `RunCompleted`, recorded when an agent run ends, completed or failed; gen locks its wire name
 *          `ai.run.completed.v1` (ADR 0100 decision 11).
 * Boundary: an integration event, recorded on the run row by the durable `RunStore` driver as it reaches `completed` or
 *           `failed`, so it leaves through the outbox in that transaction. It carries the step count and a failure's
 *           code, never text. It registers this package's own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 11); ADR 0141 (2026-10-23 note); STA-781.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { Field, Int, registerSchemas } from "@stackra/validation";

import { RUN_COMPLETED_SCHEMA } from "#core/constants/run-completed-schema.constant";

/**
 * A run ended.
 *
 * @example
 * export class MeterRunListener extends Listener {
 *   async handle(event: RunCompleted): Promise<void> { ... }
 * }
 */
export class RunCompleted extends IntegrationEvent({ name: "run.completed" }) {
  /** `completed` or `failed`. */
  // reason: two outcomes of RunStatus kept as a literal union, so the event's published type does not change
  @Field(RUN_COMPLETED_SCHEMA.shape.status)
  status!: "completed" | "failed";

  /** The steps it took. */
  @Int
  steps!: number;

  /** The run that completed. */
  runId!: PublicId<"airun">;

  /** The agent's key. */
  agent!: string;

  /** A failed run's error or refusal code; null when it completed. */
  errorCode!: string | null;
}

registerSchemas([[RunCompleted, RUN_COMPLETED_SCHEMA]]);
