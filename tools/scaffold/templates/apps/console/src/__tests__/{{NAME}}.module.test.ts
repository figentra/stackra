/**
 * Stackra file contract:
 * Purpose: proves the root module of @figentra/{{NAME}} sits where gen looks for it, `src/<name>.module.ts`, and
 *          imports no module yet.
 * Boundary: imports the module file; builds no container.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0022 (test placement).
 */
import { {{PASCAL}}Module } from "#src/{{NAME}}.module";

describe("{{PASCAL}}Module", () => {
  it("imports no module yet", () => {
    expect({{PASCAL}}Module.imports).toEqual([]);
  });
});
