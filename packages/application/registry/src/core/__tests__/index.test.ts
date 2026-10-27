/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly the registry row's surface is exported (the template imports
 *          nothing from @stackra/registry): catalogue validation, the review state, developer sandboxes, fee schedules
 *          and partner payouts, the edition install plan and the edition bundle check; the type exports resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as entry from "#core/index";
import type {
  CatalogueDiagnostic,
  CatalogueDiagnosticCode,
  DeliverableEventRow,
  EditionBundleIssue,
  EditionInstallIssue,
  EditionInstallPlan,
  InstallableModule,
  PayoutAmounts,
} from "#core/index";

describe("@stackra/registry", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "AppReview",
      "CatalogueDiagnosticCode",
      "CatalogueManifest",
      "DeliverablePayload",
      "DeveloperSandbox",
      "EditionBundle",
      "FeeSchedule",
      "ListingRole",
      "PartnerPayout",
      "PerkListing",
      "PerkRedemptionKind",
      "ReviewState",
      "canTransitionReview",
      "checkEditionBundle",
      "computePartnerPayout",
      "deliverableEvents",
      "perkEligible",
      "perkListingFee",
      "planEditionInstall",
      "redeemPerk",
      "validateCatalogue",
    ]);
  });

  it("validates a catalogue through the entry", () => {
    const diagnostics = entry.validateCatalogue([
      { member: "billing", package: "@figentra/service-billing", version: "1" },
    ]);
    expect(diagnostics).toEqual([]);
    expectTypeOf(diagnostics).toEqualTypeOf<CatalogueDiagnostic[]>();
  });

  it("types the webhook event catalogue", () => {
    expectTypeOf(entry.deliverableEvents).returns.toEqualTypeOf<DeliverableEventRow[]>();
  });

  it("types the review, payout and edition install surface", () => {
    expectTypeOf(entry.planEditionInstall).returns.toEqualTypeOf<EditionInstallPlan>();
    expectTypeOf<EditionInstallPlan["issues"][number]>().toEqualTypeOf<EditionInstallIssue>();
    expectTypeOf(entry.checkEditionBundle).returns.toEqualTypeOf<readonly EditionBundleIssue[]>();
    expectTypeOf(entry.planEditionInstall)
      .parameter(1)
      .toEqualTypeOf<readonly InstallableModule[]>();
    expectTypeOf(entry.computePartnerPayout).returns.toEqualTypeOf<PayoutAmounts>();
    expectTypeOf(entry.canTransitionReview).returns.toEqualTypeOf<boolean>();
  });

  it("resolves the type exports", () => {
    expectTypeOf<CatalogueDiagnostic["code"]>().toEqualTypeOf<CatalogueDiagnosticCode>();
    expectTypeOf<CatalogueDiagnostic>().toEqualTypeOf<{
      readonly code: CatalogueDiagnosticCode;
      readonly member: string;
      readonly path: string;
      readonly message: string;
    }>();
  });
});
