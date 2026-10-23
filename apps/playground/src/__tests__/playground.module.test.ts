/**
 * Stackra file contract:
 * Purpose: proves the root module of @figentra/playground sits where gen looks for it, `src/<name>.module.ts`, and
 *          imports no module yet.
 * Boundary: imports the module file; builds no container.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0022 (test placement).
 */
import { PlaygroundModule } from "#src/playground.module";

describe("PlaygroundModule", () => {
  it("imports no module yet", () => {
    expect(PlaygroundModule.imports).toEqual([]);
  });
});
