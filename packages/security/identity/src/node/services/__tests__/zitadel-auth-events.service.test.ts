/**
 * Stackra file contract:
 * Purpose: unit tests of `ZitadelAuthEventsService` and `ZITADEL_AUTH_EVENTS`: a signed sign-in failure becomes one
 *          refused audit entry in the organisation's scope, attributed to the verified webhook source with the
 *          provider ids in `fields`; a success is `ok`; an unknown type is acknowledged and not recorded; a bad
 *          signature, an unset key, a malformed body and a non-POST are refused before anything is recorded; an
 *          organisation with no scope is recorded with no tenant; a failed write propagates.
 * Boundary: test only; the audit store records every entry it gets, and the signature is made with `node:crypto`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decision 3); STA-1579.
 */
import { createHmac } from "node:crypto";

import { AuditTrail } from "@stackra/actions/contracts";
import type { AuditEntry } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Enum } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IdpAdminConfig } from "#config/idp-admin.config";
import { IdpAuthEvent } from "#contracts/enums/idp-auth-event.enum";
import { ZITADEL_AUTH_EVENTS } from "#core/constants/zitadel-auth-events.constant";
import { ZitadelAuthEventsService } from "#node/services/zitadel-auth-events.service";

const KEY = "zitadel-signing-key";

/** Records every entry. */
class ListAuditTrailDriver extends Driver(AuditTrail) {
  readonly entries: AuditEntry[] = [];

  override async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

/** The event call ZITADEL posts for `type`. */
const eventOf = (type: string) => ({
  aggregateID: "301234567890123456",
  aggregateType: "user",
  resourceOwner: "300000000000000001",
  instanceID: "299999999999999999",
  version: "v2",
  sequence: 7,
  event_type: type,
  created_at: "2026-10-29T12:00:00Z",
  userID: "301234567890123456",
  event_payload: { userAgentID: "ua_1" },
});

/** A POST of `body`, signed now under `key`. */
function signed(body: string, key = KEY, method = "POST"): Request {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", key).update(`${t}.${body}`).digest("hex");
  return new Request("https://api.acme.example/webhooks/zitadel/auth-events", {
    method,
    headers: { "zitadel-signature": `t=${t},v1=${v1}` },
    ...(method === "POST" ? { body } : {}),
  });
}

/** The service over a recording store and a configured key. */
function serviceOf(key = KEY) {
  const audit = new ListAuditTrailDriver();
  const secrets = new (class extends SecretStore {
    get(name: string): string | undefined {
      return name === "IDENTITY_IDP_EVENTS_SIGNING_KEY" ? key : undefined;
    }
  })();
  const config = buildConfig(IdpAdminConfig, { secrets });
  return { audit, service: new ZitadelAuthEventsService(config, audit) };
}

/** The host's mapping: one known organisation. */
const scopeOf = async (organizationId: string): Promise<PublicId | undefined> =>
  organizationId === "300000000000000001" ? "scp_acme" : undefined;

describe("ZITADEL_AUTH_EVENTS", () => {
  it("maps ZITADEL event types to known audit events, covering each", () => {
    const values = Object.values(ZITADEL_AUTH_EVENTS);
    for (const value of values) expect(Enum.values(IdpAuthEvent)).toContain(value);
    expect(new Set(values)).toEqual(new Set(Enum.values(IdpAuthEvent)));
  });
});

describe(ZitadelAuthEventsService, () => {
  it("records a signed sign-in failure as a refused entry in the organisation's scope", async () => {
    const { audit, service } = serviceOf();
    const response = await service.handle(
      signed(JSON.stringify(eventOf("user.human.password.check.failed"))),
      scopeOf,
    );
    expect(response.status).toBe(204);
    expect(audit.entries).toEqual([
      {
        call: {
          callId: "zitadel_301234567890123456_7",
          type: ZitadelAuthEventsService,
          kind: "action",
          key: "identity.idp_auth_event.sign_in_failed@1",
          actor: { kind: ActorKind.Webhook, id: "whk_zitadel", scopeId: "scp_acme" },
          scopeId: "scp_acme",
          area: ApiArea.Platform,
        },
        at: new Date("2026-10-29T12:00:00Z"),
        outcome: "refused",
        code: "sign_in_failed",
        fields: {
          idpEvent: "user.human.password.check.failed",
          idpUserId: "301234567890123456",
          idpOrganizationId: "300000000000000001",
          idpSequence: 7,
        },
      },
    ]);
    expect(JSON.stringify(audit.entries)).not.toContain("ua_1");
  });

  it("records a success as ok, and an organisation with no scope with no tenant", async () => {
    const { audit, service } = serviceOf();
    const event = { ...eventOf("user.human.mfa.otp.check.succeeded"), resourceOwner: "999" };
    await service.handle(signed(JSON.stringify(event)), scopeOf);
    expect(audit.entries[0]).toMatchObject({ outcome: "ok", fields: { idpOrganizationId: "999" } });
    expect(audit.entries[0]?.code).toBeUndefined();
    expect(audit.entries[0]?.call.scopeId).toBeUndefined();
    expect(audit.entries[0]?.call.actor.scopeId).toBeUndefined();
  });

  it("acknowledges an event type it does not record", async () => {
    const { audit, service } = serviceOf();
    for (const type of ["user.human.added", "constructor"]) {
      const response = await service.handle(signed(JSON.stringify(eventOf(type))), scopeOf);
      expect(response.status).toBe(204);
    }
    expect(audit.entries).toEqual([]);
  });

  it("refuses a bad signature, an unset key, a malformed body and a non-POST before recording", async () => {
    const body = JSON.stringify(eventOf("user.locked"));
    const { audit, service } = serviceOf();
    expect((await service.handle(signed(body, "other-key"), scopeOf)).status).toBe(401);
    expect((await serviceOf("").service.handle(signed(body, ""), scopeOf)).status).toBe(401);
    expect((await service.handle(signed("not json"), scopeOf)).status).toBe(400);
    expect((await service.handle(signed('{"event_type":"user.locked"}'), scopeOf)).status).toBe(
      400,
    );
    expect((await service.handle(signed(body, KEY, "GET"), scopeOf)).status).toBe(405);
    expect(audit.entries).toEqual([]);
  });

  it("lets a failed write through so the provider retries", async () => {
    const { audit, service } = serviceOf();
    audit.record = async () => {
      throw new Error("db down");
    };
    await expect(
      service.handle(signed(JSON.stringify(eventOf("user.locked"))), scopeOf),
    ).rejects.toThrow("db down");
  });
});
