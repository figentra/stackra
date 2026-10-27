/**
 * Stackra file contract:
 * Purpose: unit tests of `consentSteps`: a question and a listen step for an ask plan, a notice for a notice plan,
 *          nothing otherwise; a missing text refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; PUT-216; US-111.
 */
import type { Url } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { consentSteps } from "#core/voice/consent-steps.function";

const speech = { language: "ar-SA" };
const listen = { actionUrl: "https://hooks.example.test/consent" as Url, timeoutSeconds: 5 };

describe("consentSteps", () => {
  it("asks and listens under an ask plan", () => {
    expect(
      consentSteps({ notice: false, ask: true }, { ask: "Q", notice: "N" }, speech, listen),
    ).toEqual([
      { kind: "say", text: "Q", speech },
      { kind: "listen", speech, actionUrl: listen.actionUrl, timeoutSeconds: 5 },
    ]);
  });

  it("says the notice under a notice plan, and nothing otherwise", () => {
    expect(consentSteps({ notice: true, ask: false }, { notice: "N" }, speech, listen)).toEqual([
      { kind: "say", text: "N", speech },
    ]);
    expect(consentSteps({ notice: false, ask: false }, {}, speech, listen)).toEqual([]);
  });

  it("refuses a plan whose text is missing", () => {
    expect(() => consentSteps({ notice: false, ask: true }, {}, speech, listen)).toThrow(TypeError);
    expect(() => consentSteps({ notice: true, ask: false }, {}, speech, listen)).toThrow(TypeError);
  });
});
