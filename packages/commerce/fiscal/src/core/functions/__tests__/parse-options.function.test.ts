/**
 * Stackra file contract:
 * Purpose: unit tests of `parseOptions`: fitting options are returned parsed; misfits are one refusal naming every
 *          issue.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { parseOptions } from "#core/functions/parse-options.function";

const SCHEMA = z.object({ url: z.url(), slots: z.record(z.string(), z.int()) });

describe("parseOptions", () => {
  it("returns the parsed options", () => {
    expect(parseOptions(SCHEMA, { url: "https://x.test", slots: { "20": 1 } }, "d")).toEqual({
      url: "https://x.test",
      slots: { "20": 1 },
    });
  });

  it("refuses with every issue and the driver", () => {
    try {
      parseOptions(SCHEMA, { url: "nope" }, "d");
      expect.unreachable();
    } catch (error) {
      expect(isRefusal(error, FiscalOptionsInvalidError)).toBe(true);
      const details = (error as FiscalOptionsInvalidError).details;
      expect(details.driver).toBe("d");
      expect(String(details.issues)).toMatch(/url: .*; slots: /);
    }
  });
});
