/**
 * Stackra file contract:
 * Purpose: proves the root module of @figentra/{{NAME}} sits where gen looks for it, `src/<name>.module.ts`, is a
 *          module and imports no module yet.
 * Boundary: imports the module file; builds no container.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0022 (test placement).
 */
import { kindOf } from "@stackra/container";

import { {{PASCAL}}Module } from "#src/{{NAME}}.module";

describe("{{PASCAL}}Module", () => {
  it("is a module that imports no module yet", () => {
    expect(kindOf({{PASCAL}}Module)).toEqual({ kind: "module", options: { imports: [] } });
  });
});
