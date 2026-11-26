/**
 * Stackra file contract:
 * Purpose: unit tests of `keptOutput`: `@ShownOnce` fields are left out with `secretOmitted: true`, the caller's
 *          output is never edited, and an output with no schema, no marked field or no object is kept as it is.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0136.
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, ShownOnce } from "@stackra/validation";

import { keptOutput } from "#core/functions/kept-output.function";

class IssueKeyOutput extends Schema {
  @ShownOnce
  secret!: string;

  keyId!: string;
}

class PlainOutput extends Schema {
  keyId!: string;
}

describe("keptOutput", () => {
  it("leaves out a shown-once field and says so, without editing the output", () => {
    const output = { keyId: "key_1", secret: "sk_live_1" };
    expect(keptOutput(IssueKeyOutput, output)).toEqual({ keyId: "key_1", secretOmitted: true });
    expect(output).toEqual({ keyId: "key_1", secret: "sk_live_1" });
  });

  it("keeps an output as it is when nothing shown once is in it", () => {
    const output = { keyId: "key_1" };
    expect(keptOutput(IssueKeyOutput, output)).toBe(output);
    expect(keptOutput(PlainOutput, output)).toBe(output);
    expect(keptOutput(undefined, output)).toBe(output);
    expect(keptOutput(IssueKeyOutput, null)).toBeNull();
    expect(keptOutput(IssueKeyOutput, "done")).toBe("done");
  });
});
