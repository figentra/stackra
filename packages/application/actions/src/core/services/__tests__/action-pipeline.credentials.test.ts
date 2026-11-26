/**
 * Stackra file contract:
 * Purpose: unit tests of `credentials: "ignore"` in `ActionPipeline`: an anonymous-only action that declares it runs a
 *          signed-in caller's call as a fresh anonymous actor, so the handler, its context, the permission step, the
 *          audit entry and the log lines carry no part of the caller's principal, scope, assurance, approval or
 *          non-storefront origin; the same action without it still refuses a signed-in caller; an unauthenticated call
 *          runs exactly as it does without the option.
 * Boundary: test only; every port is a stand-in in a map resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098 (the actor from the credential); ADR 0138 (as amended).
 */
import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Logger, Realm, type ScopeRef } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccessControl, AuditTrail } from "#contracts/index";
import type { AuditEntry, CallDescriptor, CallOrigin } from "#contracts/index";
import { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";
import { Action } from "#core/bases/action.base";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import type { ActionContext } from "#core/types/action-context.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { Resolver } from "#core/types/resolver.type";

const NOW = new Date("2026-11-09T10:00:00.000Z");
const PRINCIPAL = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const HOME_SCOPE = "ten_01j9z3k4m5n6p7q8r9s0t1v2w4";
const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const SESSION = "ses_01j9z3k4m5n6p7q8r9s0t1v2w9";
const signedIn: Actor = {
  kind: ActorKind.User,
  id: PRINCIPAL,
  realm: Realm.Customer,
  scopeId: HOME_SCOPE,
};
const visitor: Actor = { kind: ActorKind.Anonymous, id: "anon_01j9z3k4m5n6p7q8r9s0t1v2a1" };
const STOREFRONT: CallOrigin = { kind: CallOriginKind.Storefront, id: "sfr_1" };

/** What a signed-in caller's request carries beside its actor, every part of it from the credential. */
const CREDENTIALED: Omit<CallOptions, "actor"> = {
  scope: SCOPE,
  assurance: { amr: ["pwd"], authTime: NOW, level: undefined },
  approvalId: "apr_1",
  lastWriteAt: NOW,
  origin: { kind: CallOriginKind.Console, id: SESSION },
  locale: "ar-SA",
};

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
  }
}

class RecordingAccess extends Driver(AccessControl) {
  readonly calls: CallDescriptor[] = [];

  async require(call: CallDescriptor): Promise<void> {
    this.calls.push(call);
  }

  async authorize(): Promise<void> {}
}

class Trail extends Driver(AuditTrail) {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

/** Every log line, at every level. */
class Lines extends Driver(Logger) {
  readonly lines: unknown[] = [];

  debug(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push([event, fields]);
  }

  info(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push([event, fields]);
  }

  warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push([event, fields]);
  }

  error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push([event, fields]);
  }
}

/** What the handler sees of its caller. */
function seen(ctx: ActionContext) {
  return {
    actor: ctx.actor,
    scopeId: ctx.scopeId,
    scope: ctx.scope,
    origin: ctx.origin,
    assurance: ctx.assurance,
    locale: ctx.locale,
  };
}

/** A public page's sign-up form: its visitors may also be signed in elsewhere. */
class SubscribeAction extends Action({
  key: "newsletter.subscribe",
  actors: [ActorKind.Anonymous],
  credentials: "ignore",
}) {
  async handle(_input: object, ctx: ActionContext): Promise<ReturnType<typeof seen>> {
    return seen(ctx);
  }
}

/** The same action without the option: a sign-up that refuses a signed-in caller. */
class SignUpAction extends Action({
  key: "account.sign_up",
  actors: [ActorKind.Anonymous],
}) {
  async handle(_input: object, ctx: ActionContext): Promise<ReturnType<typeof seen>> {
    return seen(ctx);
  }
}

function setup() {
  const access = new RecordingAccess();
  const trail = new Trail();
  const logger = new Lines();
  const map = new Map<AnyClass, object>([
    [Clock, new FixedClock()],
    [AccessControl, access],
    [AuditTrail, trail],
    [Logger, logger],
    [SubscribeAction, new SubscribeAction()],
    [SignUpAction, new SignUpAction()],
  ]);
  const resolver: Resolver = {
    has: (token) => map.has(token),
    get: <T extends object>(token: AnyClass<T>): T => map.get(token) as T,
  };
  return { pipeline: new ActionPipeline(resolver), access, trail, logger };
}

describe('ActionPipeline credentials: "ignore"', () => {
  it("runs a signed-in caller as a fresh anonymous visitor, with nothing of the credential left", async () => {
    const { pipeline, access, trail, logger } = setup();
    const output = await pipeline.execute(
      SubscribeAction,
      {},
      { actor: signedIn, ...CREDENTIALED },
    );
    expect(output.actor.kind).toBe(ActorKind.Anonymous);
    expect(output.actor.id).toMatch(/^anon_/);
    expect(output).toMatchObject({ scopeId: undefined, scope: undefined, origin: undefined });
    expect(output.assurance).toBeUndefined();
    expect(output.locale).toBe("ar-SA");
    expect(access.calls.at(-1)?.actor).toEqual(output.actor);
    expect(trail.entries).toHaveLength(1);
    expect(trail.entries[0]?.call.actor).toEqual(output.actor);
    const everything = JSON.stringify([output, access.calls, trail.entries, logger.lines]);
    for (const part of [PRINCIPAL, HOME_SCOPE, SCOPE.id, SESSION, "apr_1", "pwd"])
      expect(everything).not.toContain(part);
  });

  it("keeps a storefront origin, which an anonymous visitor's call carries too", async () => {
    const { pipeline } = setup();
    const output = await pipeline.execute(
      SubscribeAction,
      {},
      { actor: signedIn, origin: STOREFRONT },
    );
    expect(output).toMatchObject({ actor: { kind: ActorKind.Anonymous }, origin: STOREFRONT });
  });

  it("still refuses a signed-in caller of an anonymous-only action without the option", async () => {
    const { pipeline } = setup();
    await expect(
      pipeline.execute(SignUpAction, {}, { actor: signedIn, ...CREDENTIALED }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("runs an unauthenticated call exactly as without the option", async () => {
    const { pipeline, trail } = setup();
    const request: CallOptions = { actor: visitor, origin: STOREFRONT, locale: "ar-SA" };
    const ignoring = await pipeline.execute(SubscribeAction, {}, request);
    const plain = await pipeline.execute(SignUpAction, {}, request);
    expect(ignoring).toEqual(plain);
    expect(ignoring.actor).toEqual(visitor);
    expect(trail.entries.map((entry) => entry.call.actor)).toEqual([visitor, visitor]);
  });
});
