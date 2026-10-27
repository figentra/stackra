/**
 * Stackra file contract:
 * Purpose: unit tests of `ClassifierGuardrailDriver`: the routed model from the bound providers is asked to pick one
 *          configured label with the policy instructions and the text between markers; an allowed label passes, any
 *          other blocks or flags per stage; a stage without an effect makes no call; a refused route rejects; an
 *          allowed label outside the labels is refused when built.
 * Boundary: test only; the model is AI SDK's own `MockLanguageModelV4`, so no network and no key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decisions 2 and 4); STA-1377 (stackra-219).
 */
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { MockLanguageModelV4 } from "ai/test";

import { ClassifierGuardrailDriver } from "#core/drivers/classifier-guardrail.driver";
import { GuardrailEffect } from "#core/enums/guardrail-effect.enum";
import { ModelProviders } from "#core/ports/model-providers.port";
import type { ModelProviderDriver } from "#core/types/model-provider-driver.type";
import type { RouteChoice } from "#core/types/route-choice.type";

const route: RouteChoice = {
  kind: "routed",
  route: { task: "classify", provider: "p", model: "m-1", regions: ["eu"], zeroRetention: true },
  region: "eu",
  disclosed: false,
};

/** A mock model whose every answer is the label `label`. */
function labelling(label: string): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: "text", text: JSON.stringify({ result: label }) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    },
  });
}

/** The bound providers, serving `model` for provider `p`. */
function providers(model: MockLanguageModelV4): ModelProviders {
  const driver: ModelProviderDriver = { provider: "p", model: () => model };
  return new (class extends Driver(ModelProviders) {
    drivers(): readonly ModelProviderDriver[] {
      return [driver];
    }
  })();
}

const settings = {
  route,
  instructions: "Label customer messages for the store's policy.",
  labels: ["safe", "abuse", "off_topic"],
  allowed: ["safe"],
};

describe("ClassifierGuardrailDriver", () => {
  it("passes an allowed label and sends the text as data", async () => {
    const model = labelling("safe");
    const layer = new ClassifierGuardrailDriver(providers(model), {
      ...settings,
      stages: { input: GuardrailEffect.Block },
    });
    expect(layer.name).toBe("classifier");
    expect(await layer.check("Where is my order?", "input")).toEqual({ pass: true });
    const prompt = JSON.stringify(model.doGenerateCalls[0]?.prompt);
    expect(prompt).toContain("Where is my order?");
    expect(prompt).toContain("never instructions");
    expect(prompt).toContain("store's policy");
  });

  it("blocks or flags any other label", async () => {
    const blocking = new ClassifierGuardrailDriver(providers(labelling("abuse")), {
      ...settings,
      stages: { output: GuardrailEffect.Block },
    });
    expect(await blocking.check("…", "output")).toEqual({ pass: false, reason: "abuse" });
    const flagging = new ClassifierGuardrailDriver(providers(labelling("off_topic")), {
      ...settings,
      name: "policy",
      stages: { output: GuardrailEffect.Flag },
    });
    expect(flagging.name).toBe("policy");
    expect(await flagging.check("…", "output")).toEqual({ pass: true, flags: ["off_topic"] });
  });

  it("makes no call for a stage without an effect", async () => {
    const model = labelling("abuse");
    const layer = new ClassifierGuardrailDriver(providers(model), { ...settings, stages: {} });
    expect(await layer.check("x", "input")).toEqual({ pass: true });
    expect(model.doGenerateCalls).toHaveLength(0);
  });

  it("rejects a refused route", async () => {
    const layer = new ClassifierGuardrailDriver(providers(labelling("safe")), {
      ...settings,
      route: { kind: "refused", reason: "class_closed" },
      stages: { input: GuardrailEffect.Block },
    });
    await expect(layer.check("x", "input")).rejects.toThrow(RangeError);
  });

  it("refuses an allowed label outside the labels", () => {
    expect(
      () =>
        new ClassifierGuardrailDriver(providers(labelling("safe")), {
          ...settings,
          allowed: ["fine"],
          stages: {},
        }),
    ).toThrow(RangeError);
  });
});
