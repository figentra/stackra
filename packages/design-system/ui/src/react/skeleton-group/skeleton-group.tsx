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
import { useEffect, useMemo, useRef, type ReactElement } from "react";

import { SkeletonGroupContext } from "#react/skeleton-group/skeleton-group-context";
import type { SkeletonGroupProps } from "#react/skeleton-group/skeleton-group.props";

/**
 * A region of Skeletons that load together, with one shared state and one sweep. With a `loadingLabel` it names the
 * region to screen readers while it loads. The status element is rendered empty and filled after mount, because most
 * screen readers announce a live region only when its text changes, not when it is inserted already full. Ending the
 * load empties the element silently: a completion announcement needs its own text, which the contract does not carry.
 */
export function SkeletonGroup({
  isLoading = true,
  animationType = "shimmer",
  loadingLabel,
  className,
  children,
  ...rest
}: SkeletonGroupProps): ReactElement {
  const value = useMemo(() => ({ isLoading, animationType }), [isLoading, animationType]);
  const statusRef = useRef<HTMLSpanElement>(null);
  const text = isLoading ? (loadingLabel ?? "") : "";
  // The text is written to the DOM, not rendered, so the span reaches the page empty and React never owns its child.
  useEffect(() => {
    if (statusRef.current) statusRef.current.textContent = text;
  }, [text]);
  const isSweeping = isLoading && animationType === "shimmer";
  return (
    <SkeletonGroupContext value={value}>
      <div
        {...rest}
        className={cn(isSweeping && "skeleton--shimmer relative overflow-hidden", className) ?? ""}
      >
        {loadingLabel === undefined ? null : (
          <span ref={statusRef} role="status" className="sr-only" />
        )}
        {children}
      </div>
    </SkeletonGroupContext>
  );
}
