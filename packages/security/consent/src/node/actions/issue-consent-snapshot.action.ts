/**
 * Stackra file contract:
 * Purpose: `IssueConsentSnapshotAction`, `consent.consent_snapshot.issue@1` on `POST /consent/snapshots`: the consent
 *          endpoint (ADR 0472 decision 1), which signs a short-lived `ConsentSnapshot` of the client's stored decision
 *          and answers its token and expiry in the body.
 * Boundary: public area, open to anonymous visitors and signed-in users; not an MCP tool. It stores nothing and sets no
 *           cookie (decision 6). The subject is a signed-in user's id only (never an anonymous actor's), else what
 *           `ConsentSnapshotIssuer` picks. The idempotency policy is optional: a repeat signs a new snapshot of the same
 *           decision, which is harmless. Its permission is `ConsentSnapshotPermissions.issue`.
 * Runtime: node
 * Governing contract: ADR 0472 (decisions 1, 2 and 6); ADR 0294 (decisions 16 and 21); ADR 0462 (decision 1); ADR 0082
 *                     (the public area).
 */
import { Action, Idempotency } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind, ApiArea, HttpMethod } from "@stackra/contracts";

import type { ConsentSnapshotIssuer } from "#core/services/consent-snapshot-issuer.service";
import type { IssueConsentSnapshotInput } from "#node/schemas/issue-consent-snapshot-input.schema";
import { IssueConsentSnapshotOutput } from "#node/schemas/issue-consent-snapshot-output.schema";

/**
 * Signs the visitor's consent decision.
 *
 * @example
 * const { token } = await pipeline.execute(IssueConsentSnapshotAction, ledger.snapshotRequest(), { actor });
 */
export class IssueConsentSnapshotAction extends Action({
  key: "consent_snapshot.issue",
  actors: [ActorKind.Anonymous, ActorKind.User],
  area: ApiArea.Public,
  endpoint: { method: HttpMethod.Post, path: "/consent/snapshots" },
  idempotency: Idempotency.Optional,
  // reason: an agent acts under its principal's consent, never a visitor's browser decision
  tool: false,
}) {
  /** Signs snapshots. */
  private readonly issuer: ConsentSnapshotIssuer;

  /**
   * @param issuer - the snapshot issuer.
   */
  constructor(issuer: ConsentSnapshotIssuer) {
    super();
    this.issuer = issuer;
  }

  /** Signs `input`'s decision, bound to the signed-in user when there is one. */
  async handle(
    input: IssueConsentSnapshotInput,
    ctx: ActionContext,
  ): Promise<IssueConsentSnapshotOutput> {
    const { token, snapshot } = await this.issuer.issue(
      input,
      ctx.actor.kind === ActorKind.User ? ctx.actor.id : undefined,
    );
    return IssueConsentSnapshotOutput.create({ token, expiresAt: snapshot.expiresAt });
  }
}
