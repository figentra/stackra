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

  it("records every find and obtain call and makes a salt on the first obtain", async () => {
    const salts = new testing.SubjectSaltStoreFake();
    await expect(salts.find("usr_2")).resolves.toBeUndefined();
    const salt = await salts.obtain("usr_2");
    expect(salt).toHaveLength(16);
    await expect(salts.find("usr_2")).resolves.toBe(salt);
    expect(salts.calls("find")).toEqual(["usr_2", "usr_2"]);
    expect(salts.calls("obtain")).toEqual(["usr_2"]);
  });
});
