/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreHeldSecrets`: a name counts as held for an environment when any environment type
 *          holds it or its specific environments name that environment; only four ✗ without it is not held; colour
 *          codes are ignored; anything that is not the overview table answers null.
 * Boundary: test only; plain strings stand in for `encore secret list`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525; STA-258.
 */
import { describe, expect, it } from "@stackra/testing";

import { encoreHeldSecrets } from "#node/functions/encore-held-secrets.function";

const YES = "\u2713";
const NO = "\u2717";
const HEADER = "Secret Key   Production   Development   Local   Preview   Specific Envs";

describe(encoreHeldSecrets, () => {
  it("holds a name any environment type has, or whose specific environments name this one", () => {
    const table = [
      HEADER,
      `PROD_KEY            \u001b[32m${YES}\u001b[0m   \u001b[31m${NO}\u001b[0m   ${NO}   ${NO}`,
      `LOCAL_KEY           ${NO}   ${NO}   ${YES}   ${NO}`,
      `STAGING_ONLY        ${NO}   ${NO}   ${NO}   ${NO}   staging-eu`,
      `PAIR_KEY            ${NO}   ${NO}   ${NO}   ${NO}   production, staging-eu`,
      `OTHER_ENV           ${NO}   ${NO}   ${NO}   ${NO}   production`,
      `ARCHIVED_ONLY       ${NO}   ${NO}   ${NO}   ${NO}`,
      "",
    ].join("\n");
    expect([...(encoreHeldSecrets(table, "staging-eu") ?? [])]).toEqual([
      "PROD_KEY",
      "LOCAL_KEY",
      "STAGING_ONLY",
      "PAIR_KEY",
    ]);
  });

  it("counts a row it cannot read as held", () => {
    expect(encoreHeldSecrets(`${HEADER}\nODD_KEY   ?\n`, "staging")).toEqual(new Set(["ODD_KEY"]));
  });

  it("answers null for anything but the overview table", () => {
    expect(encoreHeldSecrets("", "staging")).toBeNull();
    expect(encoreHeldSecrets("error: not logged in\n", "staging")).toBeNull();
    expect(encoreHeldSecrets(`ID   Secret Key   Environment(s)\n`, "staging")).toBeNull();
  });
});
