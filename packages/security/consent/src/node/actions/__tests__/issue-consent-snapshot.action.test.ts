/**
 * Stackra file contract:
 * Purpose: unit tests of `IssueConsentSnapshotAction`: a public, non-tool `POST /consent/snapshots` for anonymous
 *          visitors and users, on `CONSENT_SNAPSHOT_PATH`; it answers the issuer's token and expiry and binds a
 *          signed-in user's id, never an anonymous actor's.
 * Boundary: test only; the issuer is an in-test fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0472 (decisions 1, 2 and 6).
 */
import { Idempotency } from "@stackra/actions";
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea, HttpMethod, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CONSENT_SNAPSHOT_PATH } from "#contracts/constants/consent-snapshot-path.constant";
import type { ConsentSnapshotRequest } from "#contracts/types/consent-snapshot-request.type";
import type { ConsentSnapshotIssuer } from "#core/services/consent-snapshot-issuer.service";
import { IssueConsentSnapshotAction } from "#node/actions/issue-consent-snapshot.action";
import { IssueConsentSnapshotInput } from "#node/schemas/issue-consent-snapshot-input.schema";

const EXPIRES_AT = "2026-10-30T10:00:00.000Z";

/** An action over a fake issuer. */
function setup() {
  const issuer = {
    issue: vi.fn(async (_request: ConsentSnapshotRequest, _principal?: string) => ({
      token: "payload.kid.signature",
      snapshot: { expiresAt: EXPIRES_AT },
    })),
  };
  return {
    action: new IssueConsentSnapshotAction(issuer as unknown as ConsentSnapshotIssuer),
    issuer,
  };
}

const input = IssueConsentSnapshotInput.create({
  record: null,
  globalPrivacyControl: false,
  region: "FR",
});

describe(IssueConsentSnapshotAction, () => {
  it("is the public consent endpoint, open to visitors and users and never a tool", () => {
    const record = kindOf(IssueConsentSnapshotAction);
    expect(record?.kind).toBe("action");
    expect(record?.options).toMatchObject({
      key: "consent_snapshot.issue",
      actors: [ActorKind.Anonymous, ActorKind.User],
      area: ApiArea.Public,
      endpoint: { method: HttpMethod.Post, path: CONSENT_SNAPSHOT_PATH },
      idempotency: Idempotency.Optional,
      tool: false,
    });
  });

  it("answers the token and expiry, bound to a signed-in user", async () => {
    const { action, issuer } = setup();
    const user = { kind: ActorKind.User, id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"usr"> };
    const answer = await action.handle(input, fakeActionContext({ actor: user as never }));
    expect(answer).toMatchObject({ token: "payload.kid.signature", expiresAt: EXPIRES_AT });
    expect(issuer.issue).toHaveBeenCalledWith(input, user.id);
  });

  it("never binds an anonymous actor's id", async () => {
    const { action, issuer } = setup();
    const visitor = {
      kind: ActorKind.Anonymous,
      id: "anon_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId,
    };
    await action.handle(input, fakeActionContext({ actor: visitor as never }));
    expect(issuer.issue).toHaveBeenCalledWith(input, undefined);
  });

  it("refuses a malformed stored decision at the boundary", () => {
    expect(() =>
      IssueConsentSnapshotInput.create({
        record: { policyVersion: "", decidedAt: "yesterday", categories: {} },
        globalPrivacyControl: false,
        region: null,
      }),
    ).toThrow();
  });
});
