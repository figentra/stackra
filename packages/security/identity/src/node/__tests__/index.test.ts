/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: exactly its values.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); BUILDER-RULES rule 6e.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/identity/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "AccountDeletionInput",
      "AccountDeletionOutput",
      "AccountDeletionPermissions",
      "CancelAccountDeletionAction",
      "ChallengePasskeyAction",
      "ChallengePasskeyInput",
      "ChallengePasskeyOutput",
      "ConfirmPasskeyAction",
      "ConfirmPasskeyInput",
      "ConfirmPasskeyOutput",
      "CreateAccountDeletionsMigration",
      "DeleteMyAccountAction",
      "EndErasedSubjectSessionsListener",
      "EraseDueAccountsAction",
      "EraseDueAccountsOutput",
      "PasskeyPermissions",
      "PostgresAccountDeletionsDriver",
      "RegisterPasskeyAction",
      "RegisterPasskeyInput",
      "RegisterPasskeyOutput",
      "ShowAccountDeletionQuery",
      "VerifyPasskeyAction",
      "VerifyPasskeyInput",
      "VerifyPasskeyOutput",
    ]);
  });
});
