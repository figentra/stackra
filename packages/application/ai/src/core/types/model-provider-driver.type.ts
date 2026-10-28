/**
 * Stackra file contract:
 * Purpose: `ModelProviderDriver`, the port a provider driver implements: it builds the AI SDK model instance for a
 *          model id served from a region (Bedrock through the cloud role, a provider whose key is a secret name, a
 *          local vLLM or Ollama on-prem).
 * Boundary: a type only. The service binds one driver per provider key; the driver resolves its own credentials at run
 *           time, so no key or value passes through here.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 2: provider drivers); ADR 0100 (decision 14: secrets never reach the model);
 *                     ADR 0155 (no hosted gateway).
 */
import type { LanguageModel } from "ai";

/** A provider driver. */
export interface ModelProviderDriver {
  /** The provider key route rows name (`bedrock`). */
  readonly provider: string;

  /**
   * The model instance for `model` served from `region`.
   *
   * @param model - the provider's model id from the route row.
   * @param region - the data region the route chose.
   */
  model: (model: string, region: string) => Exclude<LanguageModel, string>;
}
