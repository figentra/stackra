/**
 * Stackra file contract:
 * Purpose: `modelsByProvider`, a ModelPicker's models grouped by provider, providers in the order they first appear
 *          and models in their given order within each.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { AiModel } from "#contracts/types/ai-model.type";

/** The models, grouped by provider. */
export function modelsByProvider(
  models: readonly AiModel[],
): readonly { readonly provider: string; readonly models: readonly AiModel[] }[] {
  const groups = new Map<string, AiModel[]>();
  for (const model of models) {
    const group = groups.get(model.provider);
    if (group) group.push(model);
    else groups.set(model.provider, [model]);
  }
  return [...groups].map(([provider, list]) => ({ provider, models: list }));
}
