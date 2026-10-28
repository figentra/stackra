/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: exactly its values, and the salt fake records every call
 *          with all its arguments.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; BUILDER-RULES rule 6e.
 */
import { describe, expect, it } from "@stackra/testing";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";
import * as testing from "#testing/index";

describe("@stackra/privacy/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["SubjectSaltStoreFake", "clearPersonalData"]);
  });

  it("records every destroy call", async () => {
    const salts = testing.SubjectSaltStoreFake.holding(["usr_1"]);
    expect(salts).toBeInstanceOf(SubjectSaltStore);
    await expect(salts.destroy("usr_1")).resolves.toBe(true);
    await expect(salts.destroy("usr_1")).resolves.toBe(false);
    expect(salts.calls("destroy")).toEqual(["usr_1", "usr_1"]);
  });
});
