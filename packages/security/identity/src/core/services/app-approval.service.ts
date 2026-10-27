/**
 * Stackra file contract:
 * Purpose: `AppApprovalService`, signing in or stepping up by approving on the signed-in mobile app, the way GitHub
 *          Mobile does: the requesting device asks and shows a number (or a QR code); the app lists the principal's
 *          pending challenges with the requester's details, the user picks the matching number (or scans the code)
 *          and approves or denies; the requester polls and completes an approved challenge once into a grant.
 * Boundary: over `AppApprovalChallenges`, the contracts' `IdentityResolver` (a login hint to its principal) and
 *           `Clock`, under `IdentityConfig`'s app approval values (time to live, digits, decoys, the bound-device rule,
 *           the rate limits, the assurance reached) and its step-up window. It records `sessions.app_approval.*`
 *           events on the challenge it writes; notifications push, never this service. A requester learns `pending`,
 *           `approved` or `ended` only, so an unknown account gets a challenge that looks real and lapses. One pending
 *           challenge per principal per requesting device: a new one replaces the old. A wrong number denies. The
 *           grant is data: the host's BFF opens or raises the session at the identity provider, and the IAM decision
 *           point still decides each action.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0207 (decision 1: step-up); ADR 0141; ADR 0134.
 */
import { Service } from "@stackra/container";
import type { Clock, Email, IdentityResolver } from "@stackra/contracts";
import { recordEvent } from "@stackra/events";

import type { IdentityConfig } from "#config/identity.config";
import { AppApprovalPurpose, AppApprovalStatus } from "#contracts/index";
import type { AppApprovalChallenge, AppApprovalChallenges } from "#contracts/index";
import { AppApprovalRateLimitedError } from "#core/errors/app-approval-rate-limited.error";
import { AppApprovalRejectedError } from "#core/errors/app-approval-rejected.error";
import { AppApprovalApproved } from "#core/events/app-approval-approved.event";
import { AppApprovalDenied } from "#core/events/app-approval-denied.event";
import { AppApprovalRequested } from "#core/events/app-approval-requested.event";
import { approvalNumbers } from "#core/functions/approval-numbers.function";
import { hashApiKey } from "#core/functions/hash-api-key.function";
import { randomToken } from "#core/functions/random-token.function";
import { sameText } from "#core/functions/same-text.function";
import type { AppApprovalGrant } from "#core/types/app-approval-grant.type";
import type { AppApprovalProgress } from "#core/types/app-approval-progress.type";
import type { AppApprovalPrompt } from "#core/types/app-approval-prompt.type";
import type { AppApprovalRequest } from "#core/types/app-approval-request.type";
import type { AppApprovalTicket } from "#core/types/app-approval-ticket.type";
import type { AppApprover } from "#core/types/app-approver.type";

/**
 * Signs in or steps up by approval on the signed-in mobile app: request, list, approve or deny, then complete.
 *
 * @example
 * const ticket = await approvals.request({ purpose: AppApprovalPurpose.SignIn, requester, loginHint });
 * // the web shows ticket.number; the app: await approvals.approve(prompt.id, approver, 47);
 * if ((await approvals.status(ticket.id, ticket.pollSecret)) === "approved")
 *   await bff.openSession(await approvals.complete(ticket.id, ticket.pollSecret));
 */
export class AppApprovalService extends Service {
  /** The app approval values and the step-up window. */
  private readonly config: IdentityConfig;

  /** The challenges and the bound devices. */
  private readonly store: AppApprovalChallenges;

  /** Resolves a login hint to its principal. */
  private readonly identities: IdentityResolver;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param config - the app approval values.
   * @param store - where challenges live.
   * @param identities - the login hint lookup.
   * @param clock - the current time.
   */
  constructor(
    config: IdentityConfig,
    store: AppApprovalChallenges,
    identities: IdentityResolver,
    clock: Clock,
  ) {
    super();
    this.config = config;
    this.store = store;
    this.identities = identities;
    this.clock = clock;
  }

  /**
   * Starts a challenge and answers the requester's ticket. The ticket looks the same whether the account exists.
   *
   * @throws TypeError when a step-up names no principal or no session.
   * @throws AppApprovalRateLimitedError when the device or the target asked too often in the window.
   */
  async request(input: AppApprovalRequest): Promise<AppApprovalTicket> {
    const { purpose, requester, loginHint, sessionId } = input;
    if (
      purpose === AppApprovalPurpose.StepUp &&
      (input.principal === undefined || sessionId === undefined)
    )
      throw new TypeError("a step-up approval names its principal and its session");
    const now = this.clock.now();
    const hint = loginHint?.trim().toLowerCase() || undefined;
    const target = hint ?? input.principal ?? `qr:${requester.device}`;
    const since = new Date(now.getTime() - this.config.appApprovalWindowMinutes * 60_000);
    const max = this.config.appApprovalMaxRequests;
    if (
      (await this.store.countSince({ device: requester.device }, since)) >= max ||
      (await this.store.countSince({ target }, since)) >= max
    )
      throw AppApprovalRateLimitedError.create();
    const principal =
      input.principal ??
      (hint === undefined
        ? undefined
        : (await this.identities.principalByVerifiedEmail(hint as Email))?.id);
    if (principal !== undefined)
      for (const older of await this.store.pending(principal, now))
        if (older.requester.device === requester.device)
          await this.store.put({ ...older, status: AppApprovalStatus.Expired });
    const { number, choices } = approvalNumbers(
      this.config.appApprovalDigits,
      this.config.appApprovalDecoys,
    );
    const pollSecret = randomToken();
    const qrToken = randomToken();
    const challenge: AppApprovalChallenge = {
      id: randomToken(),
      purpose,
      requester,
      target,
      ...(principal === undefined ? {} : { principal }),
      ...(sessionId === undefined ? {} : { sessionId }),
      number,
      choices,
      pollHash: await hashApiKey(pollSecret),
      tokenHash: await hashApiKey(qrToken),
      scanned: false,
      status: AppApprovalStatus.Pending,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.appApprovalTtlSeconds * 1000),
    };
    if (principal !== undefined)
      recordEvent(
        challenge,
        AppApprovalRequested.create({
          challengeId: challenge.id,
          principal,
          purpose,
          expiresAt: challenge.expiresAt.toISOString(),
        }),
      );
    await this.store.put(challenge);
    return { id: challenge.id, pollSecret, number, qrToken, expiresAt: challenge.expiresAt };
  }

  /** What the requester may learn: `pending`, `approved`, or `ended` for anything else, a wrong secret included. */
  async status(id: string, pollSecret: string): Promise<AppApprovalProgress> {
    const challenge = await this.forRequester(id, pollSecret);
    if (challenge === undefined || this.lapsed(challenge)) return "ended";
    if (challenge.status === AppApprovalStatus.Pending) return "pending";
    return challenge.status === AppApprovalStatus.Approved ? "approved" : "ended";
  }

  /**
   * Turns an approved challenge into its grant, once.
   *
   * @throws AppApprovalRejectedError unless the challenge is approved, not lapsed, and the secret is its own.
   */
  async complete(id: string, pollSecret: string): Promise<AppApprovalGrant> {
    const challenge = await this.forRequester(id, pollSecret);
    if (
      challenge?.status !== AppApprovalStatus.Approved ||
      challenge.principal === undefined ||
      challenge.answeredAt === undefined ||
      this.lapsed(challenge)
    )
      throw AppApprovalRejectedError.create();
    await this.store.put({ ...challenge, status: AppApprovalStatus.Completed });
    const at = challenge.answeredAt;
    return {
      principal: challenge.principal,
      purpose: challenge.purpose,
      ...(challenge.sessionId === undefined ? {} : { sessionId: challenge.sessionId }),
      assurance: { level: this.config.appApprovalAssurance, authenticatedAt: at },
      freshUntil: new Date(at.getTime() + this.config.stepUpMaxAgeMinutes * 60_000),
    };
  }

  /** The approve sheet: `approver`'s pending challenges with the requester's details; none for an unbound device. */
  async pending(approver: AppApprover): Promise<readonly AppApprovalPrompt[]> {
    if (!(await this.deviceMayApprove(approver))) return [];
    const challenges = await this.store.pending(approver.principal, this.clock.now());
    return challenges.map((challenge) => this.promptOf(challenge));
  }

  /**
   * Redeems a scanned QR token: the challenge becomes `approver`'s, asks no number, and is answered as usual.
   *
   * @throws AppApprovalRejectedError when the token is unknown, used, lapsed, another principal's, or the device is
   *         not bound.
   */
  async redeem(qrToken: string, approver: AppApprover): Promise<AppApprovalPrompt> {
    const challenge = await this.store.byToken(await hashApiKey(qrToken));
    if (
      challenge === undefined ||
      challenge.scanned ||
      (challenge.principal !== undefined && challenge.principal !== approver.principal)
    )
      throw AppApprovalRejectedError.create();
    await this.answerable(challenge, approver, false);
    const scanned: AppApprovalChallenge = {
      ...challenge,
      principal: approver.principal,
      scanned: true,
    };
    await this.store.put(scanned);
    return this.promptOf(scanned);
  }

  /**
   * Approves when `number` is the shown one (or the app scanned the QR code); a wrong number denies instead.
   *
   * @returns `true` when approved, `false` when a wrong number denied it.
   * @throws AppApprovalRejectedError when the challenge cannot be answered by `approver`.
   */
  async approve(id: string, approver: AppApprover, number?: number): Promise<boolean> {
    const challenge = await this.answerable(await this.store.get(id), approver);
    if (!challenge.scanned && number !== challenge.number) {
      await this.settle(challenge, approver, "number_mismatch");
      return false;
    }
    await this.settle(challenge, approver);
    return true;
  }

  /**
   * Denies the challenge.
   *
   * @throws AppApprovalRejectedError when the challenge cannot be answered by `approver`.
   */
  async deny(id: string, approver: AppApprover): Promise<void> {
    await this.settle(
      await this.answerable(await this.store.get(id), approver),
      approver,
      "denied",
    );
  }

  /** Expires the lapsed challenges (a scheduled sweep); answers how many. */
  sweep(): Promise<number> {
    return this.store.expire(this.clock.now());
  }

  /** The challenge when `pollSecret` is its own, else `undefined`. */
  private async forRequester(
    id: string,
    pollSecret: string,
  ): Promise<AppApprovalChallenge | undefined> {
    const challenge = await this.store.get(id);
    if (challenge === undefined) return undefined;
    return sameText(await hashApiKey(pollSecret), challenge.pollHash) ? challenge : undefined;
  }

  /** Whether the time to live ran out. */
  private lapsed(challenge: AppApprovalChallenge): boolean {
    return challenge.expiresAt.getTime() <= this.clock.now().getTime();
  }

  /** Whether `approver`'s device may approve, under the bound-device rule. */
  private async deviceMayApprove(approver: AppApprover): Promise<boolean> {
    if (!this.config.appApprovalEnrolledDevicesOnly) return true;
    return this.store.isBound(approver.principal, approver.device);
  }

  /** `challenge` when `approver` may answer it now; refuses otherwise. */
  private async answerable(
    challenge: AppApprovalChallenge | undefined,
    approver: AppApprover,
    owned = true,
  ): Promise<AppApprovalChallenge> {
    if (
      challenge === undefined ||
      challenge.status !== AppApprovalStatus.Pending ||
      this.lapsed(challenge) ||
      (owned && challenge.principal !== approver.principal) ||
      !(await this.deviceMayApprove(approver))
    )
      throw AppApprovalRejectedError.create();
    return challenge;
  }

  /** Approves (no reason) or denies `challenge`, recording the event on the written state. */
  private async settle(
    challenge: AppApprovalChallenge,
    approver: AppApprover,
    reason?: "denied" | "number_mismatch",
  ): Promise<void> {
    const at = this.clock.now();
    const settled: AppApprovalChallenge = {
      ...challenge,
      status: reason === undefined ? AppApprovalStatus.Approved : AppApprovalStatus.Denied,
      answeredBy: approver.device,
      answeredAt: at,
    };
    const fields = {
      challengeId: challenge.id,
      principal: approver.principal,
      purpose: challenge.purpose,
      device: approver.device,
      at: at.toISOString(),
    };
    recordEvent(
      settled,
      reason === undefined
        ? AppApprovalApproved.create(fields)
        : AppApprovalDenied.create({ ...fields, reason }),
    );
    await this.store.put(settled);
  }

  /** The app's view of `challenge`. */
  private promptOf(challenge: AppApprovalChallenge): AppApprovalPrompt {
    return {
      id: challenge.id,
      purpose: challenge.purpose,
      requester: challenge.requester,
      choices: challenge.scanned ? [] : challenge.choices,
      createdAt: challenge.createdAt,
      expiresAt: challenge.expiresAt,
    };
  }
}
