/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly its values, so a removed or renamed export fails here.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); BUILDER-RULES rule 6e.
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";

describe("@stackra/privacy", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "MemoryPersonalDataStoreDriver",
      "MemorySubjectSaltStoreDriver",
      "PERSONAL_DATA_STORE_DRIVERS",
      "PersonalData",
      "PrivacyConfig",
      "PrivacyConfig$",
      "PrivacyOptions",
      "SubjectErased",
      "SubjectExportService",
      "personalDataDeclarations",
      "registerPersonalData",
    ]);
  });

  it("ships exactly the repository and memory store drivers", () => {
    expect([...core.PERSONAL_DATA_STORE_DRIVERS]).toEqual(["repository", "memory"]);
  });
});
