/**
 * Stackra file contract:
 * Purpose: unit tests of `personalDataDeclarations` and the credential rule: a field the model classifies `credential`
 *          is left out of every declaration (so neither the subject-access export nor erasure reads it), and a
 *          declaration with only credential fields is omitted.
 * Boundary: test only; clears the registry after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0494 (rule 4).
 */
import { DataClassification } from "@stackra/contracts";
import { Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { Classified } from "@stackra/validation";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { PersonalData } from "#core/bases/personal-data.base";
import { personalDataDeclarations } from "#core/functions/personal-data-declarations.function";
import { registerPersonalData } from "#core/functions/register-personal-data.function";
import { clearPersonalData } from "#testing/clear-personal-data.function";

class Connection extends Model {
  @Classified(DataClassification.Personal)
  accountEmail!: string | null;

  @Classified(DataClassification.Credential)
  accessToken!: string | null;

  id!: string;

  userId!: string;
}

class Secret extends Model {
  @Classified(DataClassification.Credential)
  apiKey!: string | null;

  id!: string;

  userId!: string;
}

class ConnectionPersonalData extends PersonalData({
  model: () => Connection,
  subject: "userId",
  fields: { accountEmail: ErasureMethod.Anonymise, accessToken: ErasureMethod.Delete },
}) {}

class SecretPersonalData extends PersonalData({
  model: () => Secret,
  subject: "userId",
  fields: { apiKey: ErasureMethod.Delete },
}) {}

afterEach(() => clearPersonalData());

describe("personalDataDeclarations and credentials", () => {
  it("leaves a credential field out, so export and erasure never read it", () => {
    registerPersonalData("integrations", [ConnectionPersonalData]);
    expect(personalDataDeclarations().map(({ fields }) => fields)).toEqual([
      { accountEmail: "anonymise" },
    ]);
  });

  it("omits a declaration whose fields are all credentials", () => {
    registerPersonalData("integrations", [ConnectionPersonalData, SecretPersonalData]);
    expect(personalDataDeclarations().map(({ model }) => model)).toEqual([Connection]);
  });
});
