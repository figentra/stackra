/**
 * Stackra file contract:
 * Purpose: `LedgerReconcilerService`, compares two ledgers while a host migrates drivers; the one place in the kit that
 *          injects a named instance.
 * Boundary: read-only. The type `Named<LoyaltyLedger, "primary">` asks for the instance config `ledgers.primary` names,
 *           because two instances share the port; the default one still comes by type. The instances are declared by
 *           config (`LoyaltyKitConfig.ledgers`), never registered in code.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 17); ADR 0263.
 */
import { Service } from "@stackra/container";
import type { Named } from "@stackra/container";

import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import type { MemberId } from "#contracts/types/member-id.type";

/**
 * Answers "do the old and the new ledger agree for this member?" during a driver migration.
 *
 * @example
 * if ((await reconciler.drift(member)) !== 0) logger.warn("loyalty_ledger_drift", { member });
 */
export class LedgerReconcilerService extends Service {
  /** The instance config `ledgers.primary` names. */
  private readonly primary: Named<LoyaltyLedger, "primary">;

  /** The driver config `ledger` selects. */
  private readonly current: LoyaltyLedger;

  /**
   * @param primary - the instance config names under `ledgers.primary`.
   * @param current - the driver config `ledger` selects.
   */
  constructor(primary: Named<LoyaltyLedger, "primary">, current: LoyaltyLedger) {
    super();
    this.primary = primary;
    this.current = current;
  }

  /**
   * Compares one member's balance across the two ledgers.
   *
   * @returns the difference `current − primary`; zero means the two ledgers agree.
   */
  async drift(member: MemberId): Promise<number> {
    const [primary, current] = await Promise.all([
      this.primary.balance(member),
      this.current.balance(member),
    ]);
    return current - primary;
  }
}
