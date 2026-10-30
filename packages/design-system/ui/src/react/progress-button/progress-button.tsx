/**
 * Stackra file contract:
 * Purpose: the web `ProgressButton`: the Button with a translucent fill that grows from the inline start as `progress`
 *          rises (the theme's `fast` step per change), busy and refusing presses below 1, with a visually hidden
 *          percentage that screen readers read with the label.
 * Boundary: builds on `#react/button/button` (its spinner included); the fill sits inside the button under its label,
 *           `pointer-events: none`. Reduced motion jumps the fill.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";

import { Button } from "#react/button/button";
import type { ProgressButtonProps } from "#react/progress-button/progress-button.props";

/** A button that fills as its action runs. */
export function ProgressButton({
  progress,
  progressLabel,
  variant = "primary",
  children,
  className,
  ...rest
}: ProgressButtonProps): ReactElement {
  const value = progress === undefined ? 0 : Math.min(Math.max(progress, 0), 1);
  const isRunning = progress !== undefined && value < 1;
  const isFilled = variant === "primary" || variant === "danger";
  const percent = Math.round(value * 100);

  return (
    <Button
      {...rest}
      variant={variant}
      isLoading={isRunning}
      className={cn("relative overflow-hidden", className) ?? ""}
    >
      {progress === undefined ? null : (
        <span
          aria-hidden="true"
          className={
            cn(
              "pointer-events-none absolute inset-y-0 start-0 opacity-25 transition-[width] duration-[var(--duration-fast)] motion-reduce:transition-none",
              isFilled ? "bg-white" : "bg-accent",
            ) ?? ""
          }
          style={{ width: `${percent}%` }}
        />
      )}
      <span className="relative">{children}</span>
      {progress === undefined ? null : (
        <span className="sr-only" role="status">
          {progressLabel ? `${progressLabel} ` : ""}
          {percent}%
        </span>
      )}
    </Button>
  );
}
