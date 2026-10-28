/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentSnapshotIssuer`: it re-applies the ledger's rules to the client's record (required
 *          granted, stored choices kept, unlisted categories ignored, an outdated, expired or malformed record grants
 *          nothing optional, the opt-out regime grants `defaultGranted` before a decision, Global Privacy Control
 *          refuses every optional category, an App Tracking Transparency refusal refuses marketing), caps the lifetime at the decision's expiry, binds the subject by ADR 0472
 *          decision 2, and signs a token the verifier accepts.
 * Boundary: test only; time is frozen and the signer is a fresh in-memory key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decisions 1, 2 and 5); ADR 0298 (decisions 1 to 4).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { MemorySignerDriver } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import type { ConsentSnapshotRequest } from "#contracts/types/consent-snapshot-request.type";
import { SignerConsentSnapshotKeysDriver } from "#core/drivers/signer-consent-snapshot-keys.driver";
import { ConsentCategory } from "#core/enums/consent-category.enum";
import { ConsentRegime } from "#core/enums/consent-regime.enum";
import { ConsentSnapshotIssuer } from "#core/services/consent-snapshot-issuer.service";
import { ConsentSnapshotVerifier } from "#core/services/consent-snapshot-verifier.service";

/** Necessary required; analytics optional and granted by default under opt-out; marketing optional. */
const CATEGORIES = [
  {
    category: ConsentCategory.Necessary,
    required: true,
    defaultGranted: true,
    descriptionKey: null,
  },
  {
    category: ConsentCategory.Analytics,
    required: false,
    defaultGranted: true,
    descriptionKey: null,
  },
  {
    category: ConsentCategory.Marketing,
    required: false,
    defaultGranted: false,
    descriptionKey: null,
  },
];

/** An issuer, its config and signer, with `values` layered on the test defaults. */
async function issuerWith(values: Partial<ConfigValues<ConsentConfig>> = {}) {
  const config = buildConfig(ConsentConfig, {
    values: {
      categories: CATEGORIES,
      policyVersion: "2026-10",
      expiryDays: 30,
      regionDefaults: { US: ConsentRegime.Ccpa },
      ...values,
    },
  });
  const signer = await MemorySignerDriver.generate("consent-1");
  return { issuer: new ConsentSnapshotIssuer(config, signer), config, signer };
}

/** A request whose record answers the current policy, decided `decidedAt`. */
const requestOf = (
  categories: Record<string, boolean> | null,
  extra: Partial<ConsentSnapshotRequest> = {},
  decidedAt = "2026-10-28T08:00:00.000Z",
): ConsentSnapshotRequest => ({
  record: categories === null ? null : { policyVersion: "2026-10", decidedAt, categories },
  globalPrivacyControl: false,
  region: null,
  ...extra,
});

describe("ConsentSnapshotIssuer", () => {
  it("keeps the stored choices, grants the required category and ignores unlisted ones", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer } = await issuerWith();
    const { snapshot } = await issuer.issue(
      requestOf({ analytics: true, marketing: false, unknown_thing: true }, { subject: "anon_1" }),
    );
    expect(snapshot).toMatchObject({
      subject: "anon_1",
      policyVersion: "2026-10",
      granted: ["necessary", "analytics"],
      refused: ["marketing"],
      regime: "gdpr",
      region: null,
      globalPrivacyControl: false,
      decidedAt: "2026-10-28T08:00:00.000Z",
      issuedAt: "2026-10-28T09:00:00.000Z",
      expiresAt: "2026-10-29T09:00:00.000Z",
    });
    expect(snapshot.id).toMatch(/^csn_/);
  });

  it.each([
    [
      "another policy version",
      {
        policyVersion: "2026-09",
        decidedAt: "2026-10-28T08:00:00.000Z",
        categories: { analytics: true },
      },
    ],
    [
      "an expired decision",
      {
        policyVersion: "2026-10",
        decidedAt: "2026-09-01T08:00:00.000Z",
        categories: { analytics: true },
      },
    ],
    [
      "a decision in the future",
      {
        policyVersion: "2026-10",
        decidedAt: "2026-11-01T08:00:00.000Z",
        categories: { analytics: true },
      },
    ],
    [
      "a malformed record",
      { policyVersion: "2026-10", decidedAt: "yesterday", categories: { analytics: true } },
    ],
  ])("grants nothing optional for %s", async (_case, record) => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer } = await issuerWith();
    const { snapshot } = await issuer.issue({
      record: record as ConsentSnapshotRequest["record"],
      globalPrivacyControl: false,
      region: null,
    });
    expect(snapshot.granted).toEqual(["necessary"]);
    expect(snapshot.decidedAt).toBeNull();
  });

  it("grants defaultGranted categories under the region's opt-out regime before a decision", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer } = await issuerWith();
    const { snapshot } = await issuer.issue(requestOf(null, { region: "US" }));
    expect(snapshot.granted).toEqual(["necessary", "analytics"]);
    expect(snapshot.regime).toBe("ccpa");
  });

  it("refuses every optional category under Global Privacy Control", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer } = await issuerWith();
    const { snapshot } = await issuer.issue(
      requestOf({ analytics: true, marketing: true }, { globalPrivacyControl: true }),
    );
    expect(snapshot.granted).toEqual(["necessary"]);
    expect(snapshot.globalPrivacyControl).toBe(true);
  });

  it("refuses marketing only when the phone refuses tracking", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer } = await issuerWith();
    const { snapshot } = await issuer.issue(
      requestOf({ analytics: true, marketing: true }, { appTrackingDenied: true }),
    );
    expect(snapshot.granted).toEqual(["necessary", "analytics"]);
    expect(snapshot.refused).toEqual(["marketing"]);
  });

  it("never outlives the decision", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer } = await issuerWith({ expiryDays: 30 });
    const { snapshot } = await issuer.issue(
      requestOf({ analytics: true }, {}, "2026-09-28T10:00:00.000Z"),
    );
    expect(snapshot.expiresAt).toBe("2026-10-28T10:00:00.000Z");
  });

  it("binds the anonymous id only when analytics is granted, else the principal, else a random id", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer } = await issuerWith();
    const refused = requestOf({ analytics: false }, { subject: "anon_1" });
    expect((await issuer.issue(refused, "usr_1")).snapshot.subject).toBe("usr_1");
    expect((await issuer.issue(refused)).snapshot.subject).toMatch(/^anon_/);
    expect((await issuer.issue(refused)).snapshot.subject).not.toBe("anon_1");
  });

  it("signs a token the verifier accepts", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const { issuer, config, signer } = await issuerWith();
    const { token, snapshot } = await issuer.issue(requestOf({ analytics: true }));
    const verifier = new ConsentSnapshotVerifier(
      config,
      new SignerConsentSnapshotKeysDriver(signer),
    );
    expect(await verifier.verify(token)).toEqual({
      verified: true,
      snapshotId: snapshot.id,
      subject: snapshot.subject,
      granted: ["necessary", "analytics"],
      expiresAt: new Date("2026-10-29T09:00:00.000Z"),
    });
  });
});
