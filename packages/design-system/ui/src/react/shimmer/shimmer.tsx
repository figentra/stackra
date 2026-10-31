/**
 * Stackra file contract:
 * Purpose: the web `Shimmer`: "Thinking…" (or the caller's words) in muted text with a brighter band sweeping across
 *          it in the reading direction, left to right in English and right to left in Arabic; or, as `block`, lines of
 *          Skeleton placeholders under one sweep while an answer loads.
 * Boundary: the text is real text painted through a moving gradient (`background-clip: text`), so Arabic keeps its
 *           shaping and is read out as written, in a polite status region. Under reduced motion the text is static
 *           and muted and the lines stand still. The block kind composes SkeletonGroup and Skeleton, mirrored in
 *           right-to-left so their sweep runs from the start too.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3, 4.1.3; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ShimmerProps } from "#react/shimmer/shimmer.props";
import { Skeleton } from "#react/skeleton/skeleton";
import { SkeletonGroup } from "#react/skeleton-group/skeleton-group";

/** One sweep across the text, in seconds. */
const SWEEP_S = 2;

/** A loading shimmer over text, or placeholder lines. */
export function Shimmer({
  kind = "text",
  children,
  lines = 3,
  className,
}: ShimmerProps): ReactElement {
  const t = useUiText();
  const { direction } = useLocale();
  const isReduced = useReducedMotion() ?? false;
  const text = children ?? t(AI_CHAT_KEYS.ui.shimmer.thinking);

  if (kind === "block") {
    return (
      <SkeletonGroup
        loadingLabel={text}
        animationType={isReduced ? "none" : "shimmer"}
        className={cn("grid gap-2 rtl:-scale-x-100", className) ?? ""}
      >
        {Array.from({ length: Math.max(1, lines) }, (_, index) => (
          <Skeleton
            // oxlint-disable-next-line react/no-array-index-key -- reason: placeholder lines have no identity but their place
            key={index}
            className={cn("h-3", index === lines - 1 && lines > 1 && "w-3/5 rtl:ms-auto") ?? ""}
          />
        ))}
      </SkeletonGroup>
    );
  }

  if (isReduced) {
    return (
      <span role="status" className={cn("text-sm text-muted", className) ?? ""}>
        {text}
      </span>
    );
  }
  // The gradient is 2.5 times the text's width; moving its position from 100% to 0% carries the band left to right.
  const [from, to] = direction === "rtl" ? ["0% 0%", "100% 0%"] : ["100% 0%", "0% 0%"];
  return (
    <motion.span
      role="status"
      data-slot="shimmer"
      className={
        cn(
          "bg-[length:250%_100%] bg-clip-text text-sm text-transparent",
          "bg-linear-to-r from-muted from-40% via-foreground via-50% to-muted to-60%",
          className,
        ) ?? ""
      }
      initial={{ backgroundPosition: from }}
      animate={{ backgroundPosition: to }}
      // oxlint-disable-next-line stackra/no-literal-duration -- a looping sweep needs constant speed to join seamlessly
      transition={{ duration: SWEEP_S, ease: "linear", repeat: Infinity }}
    >
      {text}
    </motion.span>
  );
}
