/**
 * Stackra file contract:
 * Purpose: proves models are grouped by provider in first-seen order, keeping their order within a group.
 * Boundary: the pure function only.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D).
 */
import { modelsByProvider } from "#core/functions/models-by-provider.function";

describe("modelsByProvider", () => {
  it("groups in first-seen order", () => {
    const groups = modelsByProvider([
      { id: "a", name: "A", provider: "Anthropic" },
      { id: "b", name: "B", provider: "OpenAI" },
      { id: "c", name: "C", provider: "Anthropic" },
    ]);
    expect(groups.map((group) => [group.provider, group.models.map((model) => model.id)])).toEqual([
      ["Anthropic", ["a", "c"]],
      ["OpenAI", ["b"]],
    ]);
    expect(modelsByProvider([])).toEqual([]);
  });
});
