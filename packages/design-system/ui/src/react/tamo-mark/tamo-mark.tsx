/**
 * Stackra file contract:
 * Purpose: the web `TamoMark`: Tamo's tile with its speech corner and two pill eyes, drawn from the brand kit's
 *          symbol, in the theme's `--tamo-mark` and `--tamo-mark-eyes`. Working, the eyes scan; error, they flatten.
 * Boundary: a mark only. It never mirrors in right-to-left (a logo keeps its shape). The scan stops under reduced
 *           motion (the brand's quiet rule: states change by the frame, not by animation).
 * Runtime: browser
 * Governing contract: ADR 0507 (decision 4: the AI mark is Tamo's); figentra/brand brands/tamo/logo (the symbol);
 *          WCAG 2.2 SC 1.1.1, 2.3.3.
 */
import { cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";

import type { TamoMarkProps } from "#react/tamo-mark/tamo-mark.props";

/** The tile with its speech corner at the bottom start (brand kit `favicon.svg`, 48 units). */
const TILE =
  "M18 4H30A14 14 0 0 1 44 18V30A14 14 0 0 1 30 44H7A3 3 0 0 1 4 41V18A14 14 0 0 1 18 4Z";
/** The two pill eyes. */
const EYES =
  "M18 14A3 3 0 0 1 21 17V24A3 3 0 0 1 18 27A3 3 0 0 1 15 24V17A3 3 0 0 1 18 14ZM30 14A3 3 0 0 1 33 17V24A3 3 0 0 1 30 27A3 3 0 0 1 27 24V17A3 3 0 0 1 30 14Z";
/** The error face: flat eyes, no motion (brand kit `tamo-error`). */
const FLAT_EYES = "M15 19.5H21V22.5H15ZM27 19.5H33V22.5H27Z";

/** The eyes' scan: the brand kit's character.think loop (1400ms alternate) on its easing.move, not a theme step. */
const THINK = {
  // oxlint-disable-next-line stackra/no-literal-duration -- reason: the brand kit's character.think, half a 1400ms loop
  duration: 0.7,
  repeat: Infinity,
  repeatType: "reverse" as const,
  // oxlint-disable-next-line stackra/no-literal-duration -- reason: the brand kit's easing.move
  ease: [0.77, 0, 0.175, 1] as const,
};

/** The mark's side in pixels by size. */
const PX = { sm: 16, md: 20, lg: 28 } as const;

/** Draws Tamo's mark, whose eyes scan while Tamo works and go flat on an error. */
export function TamoMark({
  label,
  status = "idle",
  size = "md",
  className,
}: TamoMarkProps): ReactElement {
  const isReduced = useReducedMotion() ?? false;
  const eyes = status === "error" ? FLAT_EYES : EYES;
  return (
    <svg
      viewBox="0 0 48 48"
      width={PX[size]}
      height={PX[size]}
      data-slot="tamo-mark"
      data-status={status}
      className={cn("shrink-0", className) ?? ""}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <path fill="var(--tamo-mark)" d={TILE} />
      {status === "working" && !isReduced ? (
        <motion.path
          fill="var(--tamo-mark-eyes)"
          d={eyes}
          animate={{ x: [-2, 2] }}
          transition={THINK}
        />
      ) : (
        <path fill="var(--tamo-mark-eyes)" d={eyes} />
      )}
    </svg>
  );
}
