/**
 * Stackra file contract:
 * Purpose: `ClassifierGuardrailOptions`, the settings of a `ClassifierGuardrailDriver`: its name, the model route
 *          (from `routeModel`), the policy instructions, the labels the model chooses from, the labels that pass, and
 *          the effect per stage (block or flag; a classifier has nothing to redact).
 * Boundary: a type only; settings data. The route names a provider and model the service bound through
 *           `ModelProviders`, never a model id string for a hosted gateway (ADR 0155). The labels and instructions are
 *           policy data, never written in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decisions 2 and 4); ADR 0155; STA-1377 (stackra-219).
 */
import type { GuardrailEffect } from "#core/enums/guardrail-effect.enum";
import type { GuardrailStages } from "#core/types/guardrail-stages.type";
import type { RouteChoice } from "#core/types/route-choice.type";

/** A model-classifier layer's settings. */
export interface ClassifierGuardrailOptions {
  /** The layer's name, recorded with a block or flag; `classifier` when absent. */
  readonly name?: string;

  /** The routed model the classifier runs on. */
  readonly route: RouteChoice;

  /** The policy the model classifies against. */
  readonly instructions: string;

  /** The labels the model picks one of (at least two, such as `safe`, `abuse`, `off_topic`). */
  readonly labels: readonly string[];

  /** The labels that pass; any other label is the block or flag reason. */
  readonly allowed: readonly string[];

  /** The effect per stage. */
  readonly stages: GuardrailStages<typeof GuardrailEffect.Block | typeof GuardrailEffect.Flag>;
}
