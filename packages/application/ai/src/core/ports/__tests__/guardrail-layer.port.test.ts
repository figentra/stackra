/**
 * Stackra file contract:
 * Purpose: unit tests of the `GuardrailLayer` port: it is a port, and a driver of it is a `Guardrail` that
 *          `runGuardrails` runs.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 4); ADR 0294 (decision 16); STA-1377.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { runGuardrails } from "#core/functions/run-guardrails.function";
import { GuardrailLayer } from "#core/ports/guardrail-layer.port";
import type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";

describe("GuardrailLayer", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(GuardrailLayer)).toBe(Port);
    expect(GuardrailLayer.name).toBe("GuardrailLayer");
  });

  it("runs as a layer", async () => {
    const layer = new (class extends Driver(GuardrailLayer) {
      override readonly name = "always_block";

      override check(): GuardrailVerdict {
        return { pass: false, reason: "closed" };
      }
    })();
    expect(await runGuardrails([layer], "x", "input")).toEqual({
      pass: false,
      guardrail: "always_block",
      reason: "closed",
    });
  });
});
