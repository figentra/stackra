/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: exactly its values.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); BUILDER-RULES rule 6e; STA-1580.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/identity/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "AccountDeletionInput",
      "AccountDeletionOutput",
      "AccountDeletionPermissions",
      "BffConfig",
      "BffConfig$",
      "BffOptions",
      "BffService",
      "CancelAccountDeletionAction",
      "ChallengePasskeyAction",
      "ChallengePasskeyInput",
      "ChallengePasskeyOutput",
      "ConfirmPasskeyAction",
      "ConfirmPasskeyInput",
      "ConfirmPasskeyOutput",
      "CreateAccountDeletionsMigration",
      "DeleteMyAccountAction",
      "EndAllMySessionsAction",
      "EndErasedSubjectSessionsListener",
      "EndMySessionAction",
      "EndMySessionInput",
      "EndUserSessionsAction",
      "EndUserSessionsInput",
      "EndedSessionsOutput",
      "EraseDueAccountsAction",
      "EraseDueAccountsOutput",
      "ListMySessionsQuery",
      "PasskeyPermissions",
      "PostgresAccountDeletionsDriver",
      "RegisterPasskeyAction",
      "RegisterPasskeyInput",
      "RegisterPasskeyOutput",
      "SessionLine",
      "SessionPermissions",
      "SessionsInput",
      "SessionsOutput",
      "ShowAccountDeletionQuery",
      "VerifyPasskeyAction",
      "VerifyPasskeyInput",
      "VerifyPasskeyOutput",
    ]);
  });
});
