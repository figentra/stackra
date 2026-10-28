/**
 * Stackra file contract:
 * Purpose: `ClassifierGuardrailOptions`, the settings of a `ClassifierGuardrailDriver`: its name, the model route
 *          (from `routeModel`), the policy instructions, the labels the model chooses from, the labels that pass, and
 *          the effect per stage (block or flag; a classifier has nothing to redact).
 * Boundary: settings only; settings data. The route names a provider and model the service bound through
 *           `ModelProviders`, never a model id string for a hosted gateway (ADR 0155). The labels and instructions are
 *           policy data, never written in code.
 *           A class with declared fields only: the driver's constructor names it, so gen and the container take it
 *           as a token (the host binds it with `useValue`); an object literal of the fields still fits (STA-1299).
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decisions 2 and 4); ADR 0155; STA-1377 (stackra-219).
 */
import type { GuardrailEffect } from "#core/enums/guardrail-effect.enum";
import type { GuardrailStages } from "#core/types/guardrail-stages.type";
import type { RouteChoice } from "#core/types/route-choice.type";

/** A model-classifier layer's settings. */
export abstract class ClassifierGuardrailOptions {
  /** The layer's name, recorded with a block or flag; `classifier` when absent. */
  declare readonly name?: string;

  /** The routed model the classifier runs on. */
  declare readonly route: RouteChoice;

  /** The policy the model classifies against. */
  declare readonly instructions: string;

  /** The labels the model picks one of (at least two, such as `safe`, `abuse`, `off_topic`). */
  declare readonly labels: readonly string[];

  /** The labels that pass; any other label is the block or flag reason. */
  declare readonly allowed: readonly string[];

  /** The effect per stage. */
  declare readonly stages: GuardrailStages<
    typeof GuardrailEffect.Block | typeof GuardrailEffect.Flag
  >;
}
