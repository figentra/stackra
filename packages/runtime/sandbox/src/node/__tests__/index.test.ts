/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the pool, the process body and the TypeScript step compiler
 *          are its values, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/sandbox/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "SandboxPool",
      "compileTypeScriptStep",
      "serveSandboxChild",
    ]);
  });
});
