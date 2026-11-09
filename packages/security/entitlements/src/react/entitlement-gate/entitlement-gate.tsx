/**
 * Stackra file contract:
 * Purpose: `EntitlementGate`, the entitlements kit's on-screen plan check: renders its children while the plan grants
 *          the entitlement and `fallback` (an upgrade prompt) otherwise, asking again when the entitlement or the
 *          scope changes.
 * Boundary: presentation only, over `isEntitled` and the container's `EntitlementSource`; the action pipeline's
 *           entitlement step still checks every call, so hiding a control never replaces the server's refusal. Shows
 *           nothing while the answer is pending, so neither side flashes, and reads a source that cannot be reached as
 *           not granted. Draws no element of its own and touches no platform API, so web and native share it. Throws
 *           outside a `ContainerProvider` or when the container does not bind `EntitlementSource`.
 * Runtime: isomorphic
 * Governing contract: ADR 0504 (module UI kits); ADR 0215 (decisions 1 and 3); ADR 0273 (presentation never grants).
 */
import { useContainer } from "@stackra/container/react";
import { type ReactElement, useEffect, useState } from "react";

import { EntitlementSource, isEntitled } from "#core/index";
import type { EntitlementGateProps } from "#react/entitlement-gate/entitlement-gate.props";

/**
 * Shows its children only while the plan grants the entitlement.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `EntitlementSource`.
 * @example
 * <EntitlementGate feature="billing" scope={scope?.id} fallback={<UpgradeCard />}>
 *   <InvoicesPanel />
 * </EntitlementGate>
 */
export function EntitlementGate({
  feature,
  scope,
  children,
  fallback,
}: EntitlementGateProps): ReactElement | null {
  const source = useContainer().get(EntitlementSource);
  // The answer remembers what it answers, so a new question reads as pending without resetting state in the effect.
  const [answer, setAnswer] = useState<
    | {
        readonly source: EntitlementSource;
        readonly feature: EntitlementGateProps["feature"];
        readonly scope: EntitlementGateProps["scope"];
        readonly isGranted: boolean;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    let isCurrent = true;
    const settle = (isGranted: boolean) => {
      if (isCurrent) setAnswer({ source, feature, scope, isGranted });
    };
    // An unreachable source is never read as granted (ADR 0215 decision 3).
    isEntitled(source, feature, scope).then(settle, () => settle(false));
    return () => {
      isCurrent = false;
    };
  }, [source, feature, scope]);

  if (
    answer === undefined ||
    answer.source !== source ||
    answer.feature !== feature ||
    answer.scope !== scope
  )
    return null;
  return <>{answer.isGranted ? children : fallback}</>;
}
