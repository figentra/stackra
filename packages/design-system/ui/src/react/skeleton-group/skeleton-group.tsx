/**
 * Stackra file contract:
 * Purpose: the web `SkeletonGroup`, the documented adapted form of HeroUI Native's (HeroUI v3 has none): one loading
 *          state and animation for the Skeletons inside, one sweep over all of them through HeroUI's single-shimmer
 *          class, and a status message naming the loading region.
 * Boundary: writes only the two utilities HeroUI's single-shimmer recipe needs (`relative overflow-hidden`) and
 *          `sr-only`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0165; ADR 0304; WCAG 2.2 SC 4.1.3.
 */
import { cn } from "@heroui/react";
import { useMemo, type ComponentPropsWithRef } from "react";

import type { SkeletonGroupContractProps } from "#contracts/types/skeleton-group-contract-props.type";
import { SkeletonGroupContext } from "#react/skeleton-group/skeleton-group-context";

/** Props of the web SkeletonGroup: the shared contract plus the props of its root `div`, passed through. */
export type SkeletonGroupProps = SkeletonGroupContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof SkeletonGroupContractProps>;

/**
 * A region of Skeletons that load together, with one shared state and one sweep. With a `loadingLabel` it names the
 * region to screen readers while it loads; the status element exists from the first render, so its text change is
 * announced.
 */
export function SkeletonGroup({
  isLoading = true,
  animationType = "shimmer",
  loadingLabel,
  className,
  children,
  ...rest
}: SkeletonGroupProps) {
  const value = useMemo(() => ({ isLoading, animationType }), [isLoading, animationType]);
  const isSweeping = isLoading && animationType === "shimmer";
  return (
    <SkeletonGroupContext value={value}>
      <div
        {...rest}
        className={cn(isSweeping && "skeleton--shimmer relative overflow-hidden", className) ?? ""}
      >
        {loadingLabel === undefined ? null : (
          <span role="status" className="sr-only">
            {isLoading ? loadingLabel : ""}
          </span>
        )}
        {children}
      </div>
    </SkeletonGroupContext>
  );
}
