/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the module, settings, permissions and policy, actions,
 *          queries, schemas, the workflow and its signal, events, extension point and extension, listener, models, the
 *          panel resource, document and widgets, services, the Postgres, threshold and parties drivers and migrations are its
 *          values; the factories, the seeder and the internal constants are not.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/loyalty-kit/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "AccountEnrolled",
      "AccountFrozen",
      "AccountNotes",
      "AccountService",
      "AppendOnlyLedgerEntriesMigration",
      "ConfirmRedemptionAction",
      "ConfirmRedemptionInput",
      "ConfirmRedemptionOutput",
      "CreateLoyaltyTablesMigration",
      "EarnVisitAction",
      "EarnVisitInput",
      "EarnVisitOutput",
      "EnrollMemberAction",
      "EnrollMemberInput",
      "EnrollMemberOutput",
      "ExpirePointsAction",
      "ExpirePointsInput",
      "ExpirePointsOutput",
      "FreezeAccountAction",
      "FreezeAccountInput",
      "FreezeAccountOutput",
      "GetBalanceInput",
      "GetBalanceQuery",
      "LedgerEntriesAccountIdIndexMigration",
      "LedgerEntry",
      "LedgerReconcilerService",
      "LoyaltyAccount",
      "LoyaltyAccountPermissions",
      "LoyaltyAccountPolicy",
      "LoyaltyAccountResource",
      "LoyaltyCardPass",
      "LoyaltyKitExtensionPoint",
      "LoyaltyKitModule",
      "LoyaltyKitSettings",
      "LoyaltyOverviewDocument",
      "LoyaltyTierSettings",
      "PartiesLoyaltyMembersDriver",
      "PointsBalanceWidget",
      "PointsEarned",
      "PointsEarnedV1Change",
      "PointsExpired",
      "PointsImported",
      "PointsIssuedInput",
      "PointsIssuedQuery",
      "PointsIssuedWidget",
      "PointsRedeemed",
      "PointsTakenBack",
      "PostgresLoyaltyLedgerDriver",
      "QuotedRedemption",
      "RecalculateTierListener",
      "RedeemPointsAction",
      "RedeemPointsInput",
      "RedeemPointsOutput",
      "RedeemPointsWorkflow",
      "RedemptionConfirmed",
      "ThresholdLoyaltyTierPolicyDriver",
      "TierMultiplierExtension",
    ]);
  });
});
