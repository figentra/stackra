/**
 * Stackra file contract:
 * Purpose: `factsFrom(providers, subject)`, the facts every bound `FactProvider` computes for one subject, keyed by
 *          each provider's source key, ready to spread into the facts a consumer passes to `evaluate`.
 * Boundary: pure apart from the providers it awaits. Two providers of one source key are a wiring mistake and throw,
 *           so one add-on never silently replaces another's facts. A provider that rejects rejects the whole call
 *           (the caller fails closed).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 4); ADR 0462 (decision 1).
 */
import type { FactProvider } from "#core/ports/fact-provider.port";
import type { FactSubject } from "#core/types/fact-subject.type";
import type { RuleFacts } from "#core/types/rule-facts.type";

/**
 * The providers' facts for `subject`.
 *
 * @throws Error when two providers share a source key, or a provider rejects.
 * @example
 * const facts = { order: { total }, ...(await factsFrom(providers, { model: "commerce.customer", id })) };
 * evaluate(rule, facts, { now });
 */
export async function factsFrom(
  providers: readonly FactProvider[],
  subject: FactSubject,
): Promise<RuleFacts> {
  const keys = providers.map((provider) => provider.source.key);
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
  if (duplicate !== undefined)
    throw new Error(`two fact providers supply the source \`${duplicate}\``);
  const values = await Promise.all(providers.map((provider) => provider.factsOf(subject)));
  return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? {}]));
}
