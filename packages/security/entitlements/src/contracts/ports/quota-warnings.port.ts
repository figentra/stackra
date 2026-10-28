/**
 * Stackra file contract:
 * Purpose: the `QuotaWarnings` port: told when a call passes a quota only by its grace period (the soft limit), so the
 *          app can warn the scope before the hard refusal (`quota_exceeded`).
 * Boundary: an abstract class that is its own token, implemented by the app or the usage service (a notice, an email,
 *           a banner). Optional: with none bound the call still passes during grace, silently. A warning never
 *           refuses; a driver that fails here fails the call, so implement it as a fire-and-forget write.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 3: quotas); ADR 0215 (decision 4: soft limits with grace); stackra-309.
 */
import { Port, type PublicId } from "@stackra/contracts";

/**
 * Hears that a scope is past a quota's allowance.
 *
 * @example
 * export class NoticeQuotaWarningsDriver extends Driver(QuotaWarnings) {
 *   async warn(entitlement: string, scope: PublicId | undefined, used: number, limit: number): Promise<void> {
 *     await this.notices.post(scope, "entitlements.quota_warning", { entitlement, used, limit });
 *   }
 * }
 */
export abstract class QuotaWarnings extends Port {
  /**
   * A call in `scope` passed `entitlement` with `used` already at or past its allowance `limit`.
   *
   * @param entitlement - the quota's locked key (`ai.token_quota`).
   */
  abstract warn(
    entitlement: string,
    scope: PublicId | undefined,
    used: number,
    limit: number,
  ): Promise<void>;
}
