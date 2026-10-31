/**
 * Stackra file contract:
 * Purpose: the web `LoadingOverlay`: a region whose content is covered by a translucent layer with a spinner and a
 *          message while `isLoading`, blocking pointer and keyboard (the content is `inert`) without changing layout.
 * Boundary: the region is `aria-busy`; the message is a polite status, so the start is announced once. The layer
 *           appears without motion, so the motion setting has nothing to reduce.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1 and 4.1.3; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { LoadingOverlayProps } from "#react/loading-overlay/loading-overlay.props";
import { Spinner } from "#react/spinner/spinner";

/** Covers a region while it loads. */
export function LoadingOverlay({
  children,
  isLoading,
  message,
  className,
}: LoadingOverlayProps): ReactElement {
  const t = useUiText();
  return (
    <div
      data-slot="loading-overlay"
      aria-busy={isLoading}
      className={cn("relative rounded-[var(--radius-container)]", className)}
    >
      <div inert={isLoading}>{children}</div>
      {isLoading ? (
        <div
          role="status"
          className="absolute inset-0 z-(--z-raised) flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-background/75 p-4 text-center"
        >
          <Spinner size="md" />
          <span className="text-sm font-medium">
            {message ?? t(DISPLAY_KEYS.ui.loading_overlay.loading)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
