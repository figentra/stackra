/**
 * Stackra file contract:
 * Purpose: the web `FlipCard`: two faces stacked in one CSS 3D card that turns over on a click, Enter or Space (the
 *          theme's `base` step), toward the reading end so the turn mirrors in Arabic; each face hides its back, and
 *          the hidden face is `inert`, so neither focus nor a screen reader reaches it.
 * Boundary: the card takes the front's size; the back fills it. Under reduced motion the faces swap at once. The card
 *           is a button whose description is `flipLabel`; put no other control on a face of a card that turns.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.1.1.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { useId, useState } from "react";
import { useLocale } from "react-aria-components";

import type { FlipCardProps } from "#react/flip-card/flip-card.props";

/** The turn: the theme's base step, none under reduced motion. */
// Visibility turns with the face: the face going away stays visible until the turn ends, then is hidden, so the
// face behind is neither painted over nor read (axe took the hidden back as covering the front's text).
const TURN =
  "transition-[transform,visibility] duration-[var(--duration-base)] ease-out motion-reduce:transition-none [backface-visibility:hidden]";

/** A card with two faces that turns over on a press. */
export function FlipCard({
  front,
  back,
  isFlipped,
  defaultFlipped,
  onFlipChange,
  flipLabel,
  axis = "horizontal",
  isDisabled = false,
  className,
  ...rest
}: FlipCardProps): ReactElement {
  const [ownFlipped, setOwnFlipped] = useState(defaultFlipped ?? false);
  const flipped = isFlipped ?? ownFlipped;
  const sign = useLocale().direction === "rtl" ? -1 : 1;
  const hintId = useId();
  const rotate = (degrees: number) =>
    `perspective(1000px) ${axis === "horizontal" ? "rotateY" : "rotateX"}(${degrees * sign}deg)`;
  const flip = () => {
    setOwnFlipped(!flipped);
    onFlipChange?.(!flipped);
  };

  return (
    <div
      {...rest}
      data-slot="flip-card"
      className={cn("relative", !isDisabled && "cursor-pointer", className)}
      {...(isDisabled
        ? {}
        : {
            role: "button",
            tabIndex: 0,
            "aria-pressed": flipped,
            "aria-describedby": hintId,
            onClick: flip,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              flip();
            },
          })}
    >
      <span id={hintId} hidden>
        {flipLabel}
      </span>
      <div
        className={TURN}
        style={{ transform: rotate(flipped ? 180 : 0), visibility: flipped ? "hidden" : "visible" }}
        inert={flipped}
      >
        {front}
      </div>
      <div
        className={cn("absolute inset-0", TURN)}
        style={{
          transform: rotate(flipped ? 0 : -180),
          visibility: flipped ? "visible" : "hidden",
        }}
        inert={!flipped}
      >
        {back}
      </div>
    </div>
  );
}
