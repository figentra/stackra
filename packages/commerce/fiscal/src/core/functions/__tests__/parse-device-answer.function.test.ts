/**
 * Stackra file contract:
 * Purpose: unit tests of `parseDeviceAnswer`: a fitting answer is parsed; another shape is an unavailable refusal with
 *          status 0.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { parseDeviceAnswer } from "#core/functions/parse-device-answer.function";

const ANSWER = z.object({ counter: z.int() });

describe("parseDeviceAnswer", () => {
  it("returns a fitting answer", () => {
    expect(parseDeviceAnswer(ANSWER, { counter: 3 }, "d")).toEqual({ counter: 3 });
  });

  it("refuses another shape", () => {
    try {
      parseDeviceAnswer(ANSWER, { counter: "3" }, "d");
      expect.unreachable();
    } catch (error) {
      expect(isRefusal(error, FiscalAuthorityUnavailableError)).toBe(true);
      expect((error as FiscalAuthorityUnavailableError).details).toEqual({
        driver: "d",
        status: 0,
      });
    }
  });
});
