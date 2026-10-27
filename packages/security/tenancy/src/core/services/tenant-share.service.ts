/**
 * Stackra file contract:
 * Purpose: `TenantShareService`, the rules of a cross-tenant share: one tenant proposes, the other accepts or
 *          declines, either revokes; inside one region an item kind the share lists flows by events, across regions
 *          each item is released by the sender after the legal entity's transfer rules allow it.
 * Boundary: over `TenantShares`, `TransferCheck` and `Clock`; the only writer of a share. The acting tenant is the
 *           caller's verified tenant, never a request field. A share is never a grant or a tree position (ADR 0343
 *           decision 7). What revocation does to received copies is `revocationPlan`'s answer, carried out by the
 *           receiving service. Visibility on both sides stays the IAM decision point's (decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decisions 1 to 7).
 */
import { Service } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";

import { ShareStatus } from "#core/enums/share-status.enum";
import { ShareTransitionInvalidError } from "#core/errors/share-transition-invalid.error";
import { TransferRefusedError } from "#core/errors/transfer-refused.error";
import type { TenantShares } from "#core/ports/tenant-shares.port";
import type { TransferCheck } from "#core/ports/transfer-check.port";
import type { ShareProposal } from "#core/types/share-proposal.type";
import type { ShareRelease } from "#core/types/share-release.type";
import type { SharedRecordRef } from "#core/types/shared-record-ref.type";
import type { TenantShare } from "#core/types/tenant-share.type";

/**
 * Consented cross-tenant shares.
 *
 * @example
 * await shares.propose({ id, proposer: firm.id, receiver: client.id, source, items, crossRegion: false });
 * await shares.accept(id, client.id, { kind: "matters.matter", id: matterId });
 */
export class TenantShareService extends Service {
  /** The store. */
  private readonly store: TenantShares;

  /** The cross-region transfer rules. */
  private readonly transfers: TransferCheck;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param store - where shares are kept.
   * @param transfers - the sending legal entity's transfer rules.
   * @param clock - the current time.
   */
  constructor(store: TenantShares, transfers: TransferCheck, clock: Clock) {
    super();
    this.store = store;
    this.transfers = transfers;
    this.clock = clock;
  }

  /**
   * Proposes a share of `proposal.source` to `proposal.receiver`.
   *
   * @throws ShareTransitionInvalidError when a tenant shares with itself, lists no item kind, or the id is taken.
   */
  async propose(proposal: ShareProposal): Promise<TenantShare> {
    if (proposal.proposer === proposal.receiver || Object.keys(proposal.items).length === 0)
      throw ShareTransitionInvalidError.create();
    if ((await this.store.get(proposal.id)) !== undefined)
      throw ShareTransitionInvalidError.create();
    const now = this.clock.now();
    const share: TenantShare = {
      ...proposal,
      status: ShareStatus.Proposed,
      proposedAt: now,
      changedAt: now,
    };
    await this.store.save(share);
    return share;
  }

  /**
   * The receiver accepts, joining its record `target`.
   *
   * @throws ShareTransitionInvalidError when `by` is not the receiver or the share is not proposed.
   */
  accept(id: PublicId<"shr">, by: PublicId<"scp">, target: SharedRecordRef): Promise<TenantShare> {
    return this.change(id, (share) =>
      share.receiver === by && share.status === ShareStatus.Proposed
        ? { ...share, target, status: ShareStatus.Active }
        : undefined,
    );
  }

  /**
   * The receiver refuses the proposal.
   *
   * @throws ShareTransitionInvalidError when `by` is not the receiver or the share is not proposed.
   */
  decline(id: PublicId<"shr">, by: PublicId<"scp">): Promise<TenantShare> {
    return this.change(id, (share) =>
      share.receiver === by && share.status === ShareStatus.Proposed
        ? { ...share, status: ShareStatus.Declined }
        : undefined,
    );
  }

  /**
   * Either tenant ends the share; nothing more crosses.
   *
   * @throws ShareTransitionInvalidError when `by` is not a party or the share is already over.
   */
  revoke(id: PublicId<"shr">, by: PublicId<"scp">): Promise<TenantShare> {
    return this.change(id, (share) =>
      (share.proposer === by || share.receiver === by) &&
      (share.status === ShareStatus.Proposed || share.status === ShareStatus.Active)
        ? { ...share, status: ShareStatus.Revoked, revokedBy: by }
        : undefined,
    );
  }

  /**
   * Whether an update of an item of `kind` may flow by events on `id` now: an active share inside one region that
   * lists the kind.
   */
  async flows(id: PublicId<"shr">, kind: string): Promise<boolean> {
    const share = await this.store.get(id);
    return (
      share !== undefined &&
      share.status === ShareStatus.Active &&
      !share.crossRegion &&
      Object.hasOwn(share.items, kind)
    );
  }

  /**
   * The sender releases `item` on a cross-region share, after `legalEntity`'s transfer rules allow it.
   *
   * @throws ShareTransitionInvalidError when `by` is not the proposer, the share is not an active cross-region share,
   *         or it does not list the item's kind.
   * @throws TransferRefusedError when the transfer rules refuse it.
   */
  async release(
    id: PublicId<"shr">,
    by: PublicId<"scp">,
    item: SharedRecordRef,
    legalEntity: PublicId,
  ): Promise<ShareRelease> {
    const share = await this.store.get(id);
    if (
      share === undefined ||
      share.proposer !== by ||
      share.status !== ShareStatus.Active ||
      !share.crossRegion ||
      !Object.hasOwn(share.items, item.kind)
    )
      throw ShareTransitionInvalidError.create();
    if (!(await this.transfers.mayRelease(legalEntity, share.receiver, item.kind)))
      throw TransferRefusedError.create({ itemKind: item.kind });
    return { share: id, item, legalEntity, releasedAt: this.clock.now() };
  }

  /** Applies `next` to the share `id` and stores the result, or refuses when `next` answers nothing. */
  private async change(
    id: PublicId<"shr">,
    next: (share: TenantShare) => TenantShare | undefined,
  ): Promise<TenantShare> {
    const share = await this.store.get(id);
    const changed = share === undefined ? undefined : next(share);
    if (changed === undefined) throw ShareTransitionInvalidError.create();
    const stamped: TenantShare = { ...changed, changedAt: this.clock.now() };
    await this.store.save(stamped);
    return stamped;
  }
}
