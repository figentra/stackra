/**
 * Stackra file contract:
 * Purpose: unit tests of `issuesOf`: each issue of a failed zod parse becomes its dotted path and message, in
 *          document order; array indexes join as their digits and a root issue has the empty path.
 * Boundary: test only; the errors come from real zod parses.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { issuesOf } from "#core/functions/issues-of.function";

/** The zod error of parsing `value` with `schema`. */
function errorOf(schema: z.ZodType, value: unknown): z.ZodError {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("expected the parse to fail");
  return result.error;
}

describe("issuesOf", () => {
  it("names each issue by its dotted path, in document order", () => {
    const schema = z.object({
      environments: z.object({ dev: z.object({ port: z.number().max(65_535) }) }),
      hosts: z.array(z.string()),
    });

    const issues = issuesOf(
      errorOf(schema, { environments: { dev: { port: 70_000 } }, hosts: ["a", 7] }),
    );

    expect(issues.map((issue) => issue.path)).toEqual(["environments.dev.port", "hosts.1"]);
    expect(issues[0]?.message).toMatch(/65535/);
  });

  it("gives a root issue the empty path", () => {
    expect(issuesOf(errorOf(z.object({}), "not an object"))).toEqual([
      { path: "", message: expect.any(String) },
    ]);
  });
});
