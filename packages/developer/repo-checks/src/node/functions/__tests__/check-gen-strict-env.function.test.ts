/**
 * Stackra file contract:
 * Purpose: unit tests of `checkGenStrictEnv`: a gen task whose env lists STACKRA_GEN_STRICT passes; a gen or
 *          workspace gen task without it is one finding each; a pass-through does not count; loose env mode and a
 *          missing turbo.jsonc need nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: the staged gen checks; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkGenStrictEnv } from "#node/functions/check-gen-strict-env.function";

describe("checkGenStrictEnv", () => {
  it("passes gen tasks whose env carries STACKRA_GEN_STRICT", () => {
    const turbo = `{
      // the cache key includes it
      "tasks": {
        "gen": { "env": ["STACKRA_GEN_STRICT"] },
        "//#gen:workspace": { "env": ["STACKRA_GEN_STRICT"] },
        "build": {},
      },
    }`;
    expect(checkGenStrictEnv(turbo)).toEqual([]);
  });

  it("reports each gen task that would drop the variable, a pass-through included", () => {
    const turbo = `{
      "globalPassThroughEnv": ["STACKRA_GEN_STRICT"],
      "tasks": { "gen": {}, "//#gen:workspace": { "env": ["OTHER"] }, "lint": {} },
    }`;
    const findings = checkGenStrictEnv(turbo);
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain('task "gen"');
    expect(findings[1]).toContain('task "//#gen:workspace"');
  });

  it("needs nothing under loose env mode or without a turbo.jsonc", () => {
    expect(checkGenStrictEnv('{ "envMode": "loose", "tasks": { "gen": {} } }')).toEqual([]);
    expect(checkGenStrictEnv(undefined)).toEqual([]);
  });
});
