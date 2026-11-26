/**
 * Stackra file contract:
 * Purpose: `EntitlementGateProps`, what a host hands `EntitlementGate`: the entitlement a part of the screen needs, the
 *          scope whose plan answers, the content shown when the plan grants it and the content shown when it does not.
 * Boundary: an interface in its own file beside the component (ADR 0305). The plan is the container's
 *           `EntitlementSource`, never props; the words of an upgrade prompt are the host's, inside `fallback`.
 * Runtime: isomorphic
 * Governing contract: ADR 0504 (module UI kits); ADR 0215 (decisions 1 and 3); ADR 0305.
 */
import type { PublicId } from "@stackra/contracts";
import type { ReactNode } from "react";

import type { EntitlementKey } from "#contracts/types/entitlement-key.type";
import type { EntitlementRef } from "#contracts/types/entitlement-ref.type";

/**
 * The entitlement and the content to show.
 *
 * @example
 * <EntitlementGate feature="billing" fallback={<UpgradeCard labels={labels.upgrade} />}>
 *   <InvoicesPanel />
 * </EntitlementGate>
 */
export interface EntitlementGateProps {
  /** The entitlement the content needs: its class, or its locked key (`billing`, `catalogue.export`). */
  readonly feature: EntitlementRef | EntitlementKey;
  /** The id of the scope whose plan answers; left out, the platform-wide plan. */
  readonly scope?: PublicId | undefined;
  /** Shown while the plan grants the entitlement. */
  readonly children?: ReactNode;
  /** Shown while it does not, such as an upgrade prompt; nothing by default. */
  readonly fallback?: ReactNode;
}
