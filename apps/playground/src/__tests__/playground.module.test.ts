/**
 * Stackra file contract:
 * Purpose: proves the root module of @figentra/playground sits where gen looks for it, `src/<name>.module.ts`,
 *          extends the Module kind base and imports no module yet.
 * Boundary: imports the module file and reads the kind registry; builds no container.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12, decision 25); ADR 0022 (test placement).
 */
import { kindOf } from "@stackra/container";

import { PlaygroundModule } from "#src/playground.module";

describe("PlaygroundModule", () => {
  it("is a module that imports no module yet", () => {
    expect(kindOf(PlaygroundModule)).toEqual({ kind: "module", options: { imports: [] } });
  });
});
