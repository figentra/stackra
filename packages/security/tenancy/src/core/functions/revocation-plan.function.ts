/**
 * Stackra file contract:
 * Purpose: `revocationPlan`, what revoking a share does to each copy the receiver holds: delete it when its item
 *          kind's terms say so, else keep it as a severed copy; a copy under a legal hold, or of a kind the share no
 *          longer lists, is always kept.
 * Boundary: pure. Keeping is the safe side: a missing term never deletes a record the receiver may need.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 5); ADR 0134 (legal holds).
 */
import { RevokedCopy } from "#core/enums/revoked-copy.enum";
import type { ReceivedCopy } from "#core/types/received-copy.type";
import type { RevocationStep } from "#core/types/revocation-step.type";
import type { TenantShare } from "#core/types/tenant-share.type";

/**
 * The fate of each copy of `share`.
 *
 * @example
 * for (const step of revocationPlan(share, copies)) await (step.action === RevokedCopy.Delete ? drop : sever)(step.copy);
 */
export function revocationPlan(
  share: Pick<TenantShare, "items">,
  copies: readonly ReceivedCopy[],
): readonly RevocationStep[] {
  return copies.map((copy) => {
    const terms = Object.hasOwn(share.items, copy.kind) ? share.items[copy.kind] : undefined;
    const remove = !copy.held && terms?.onRevoke === RevokedCopy.Delete;
    return { copy, action: remove ? RevokedCopy.Delete : RevokedCopy.Keep };
  });
}
