/**
 * Stackra file contract:
 * Purpose: unit tests of `appendMembers`: lines added at the end of a class body after a blank line, into an empty
 *          `{}` body, and at the start of the body.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0128 (member order).
 */
import { describe, expect, it } from "@stackra/testing";

import { appendMembers } from "#node/feature-scaffold/functions/append-members.function";

describe(appendMembers, () => {
  it("adds members at the end, at the start, and into an empty body", () => {
    const text = "/** A. */\nexport class A extends B {\n  a = 1;\n}\n";

    expect(appendMembers(text, ["  b = 2;"])).toBe(
      "/** A. */\nexport class A extends B {\n  a = 1;\n\n  b = 2;\n}\n",
    );
    expect(appendMembers(text, ["  b = 2;"], "start")).toBe(
      "/** A. */\nexport class A extends B {\n  b = 2;\n\n  a = 1;\n}\n",
    );
    expect(appendMembers("export class A {}\n", ["  b = 2;"], "start")).toBe(
      "export class A {\n  b = 2;\n}\n",
    );
    expect(appendMembers(text, [])).toBe(text);
  });
});
