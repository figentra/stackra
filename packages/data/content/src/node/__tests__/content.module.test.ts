/**
 * Stackra file contract:
 * Purpose: unit tests of `ContentModule`: a module whose exports are `CustomFieldService` and `RevisionService`, so a
 *          host that keeps revisions or custom fields can inject them.
 * Boundary: test only; reads the module's recorded options. The host wiring and the run of the package migrations are
 *           gen's and run with it (STA-339).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 12 and 16).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { ContentModule } from "#node/content.module";
import { CustomFieldService } from "#node/services/custom-field.service";
import { RevisionService } from "#node/services/revision.service";

describe("ContentModule", () => {
  it("is a module that exports the two services hosts inject", () => {
    expect(kindOf(ContentModule)?.kind).toBe("module");
    expect(kindOf(ContentModule)?.options["exports"]).toEqual([
      CustomFieldService,
      RevisionService,
    ]);
  });
});
