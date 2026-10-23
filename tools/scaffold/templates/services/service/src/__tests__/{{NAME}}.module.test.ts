/**
 * Stackra file contract:
 * Purpose: proves the root module of @figentra/service-{{NAME}} sits where gen looks for it, `src/<name>.module.ts`,
 *          and hosts no feature module yet.
 * Boundary: imports the module file; builds no container.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0022 (test placement).
 */
import { {{PASCAL}}Module } from "#src/{{NAME}}.module";

// shortcut: a unit test until @stackra/container ships createTestingModule; then `.int.test.ts` that compiles it.
describe("{{PASCAL}}Module", () => {
  it("hosts no feature module yet", () => {
    expect({{PASCAL}}Module.imports).toEqual([]);
  });
});
