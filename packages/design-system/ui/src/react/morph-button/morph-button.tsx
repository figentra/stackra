/**
 * Stackra file contract:
 * Purpose: the web `MorphButton`: one button that morphs with its action's state. `idle` shows its label; `loading`
 *          narrows to a circle with a spinner; `success` turns into a green circle with a check, then settles back to
 *          the label after `successDuration`; `error` takes the danger colour, shakes once and shows the error words.
 *          Width, colour and the icon cross-fade animate; each state's words are announced through a polite live region.
 * Boundary: HeroUI's Button, so variants, sizes and focus are the theme's. The width animates through the label's grid
 *           column and the padding, never a measured pixel width. Motion follows `useMotion`: `full` animates and shakes,
 *           `reduced` only fades colour and icons, `none` snaps. Presses reach `onPress` only while `idle` or `error`.
 *           Logical properties only, so the label and its icon slot follow the reading direction.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.3.3, 4.1.3.
 */
import { Button as HeroButton, Spinner, cn } from "@heroui/react";
import { type ReactElement, useEffect, useRef, useState } from "react";

import type { MorphButtonState } from "#contracts/enums/morph-button-state.enum";
import type { Size } from "#contracts/enums/size.enum";
import { useMotion } from "#react/design-system-provider/use-motion";
import { Icon } from "#react/icon/icon";
import type { MorphButtonProps } from "#react/morph-button/morph-button.props";

/** The button's height per size, as HeroUI draws it (taller below `md`), so the circle is exactly round. */
const ROUND: Readonly<Record<Size, string>> = Object.freeze({
  sm: "[--morph-h:2.25rem] md:[--morph-h:2rem]",
  md: "[--morph-h:2.5rem] md:[--morph-h:2.25rem]",
  lg: "[--morph-h:2.75rem] md:[--morph-h:2.5rem]",
});

/** The short horizontal shake of `error`, in px. */
const SHAKE = [0, -6, 6, -4, 4, 0].map((x) => ({ transform: `translateX(${x}px)` }));

/** A button that narrows to a spinner, then to a check, or shakes into its error words. */
export function MorphButton({
  state = "idle",
  labels,
  onPress,
  // oxlint-disable-next-line stackra/no-literal-duration -- how long the success label dwells, not motion
  successDuration = 1500,
  onSuccessEnd,
  variant = "primary",
  size = "md",
  isDisabled,
  isFullWidth,
  className,
  ...rest
}: MorphButtonProps): ReactElement {
  const motion = useMotion();
  const ref = useRef<HTMLButtonElement>(null);
  // `success` settles back to the label by itself; a new state clears it.
  const [settledFor, setSettledFor] = useState<MorphButtonState>();
  const shown = state === "success" && settledFor === "success" ? "idle" : state;
  const words = labels[shown] ?? labels.idle;
  const isRound = shown === "loading" || shown === "success";
  const takesPress = shown === "idle" || shown === "error";
  const isSolid = variant === "primary" || variant === "danger";

  useEffect(() => {
    if (state !== "success") return undefined;
    const timer = setTimeout(() => {
      setSettledFor("success");
      onSuccessEnd?.();
    }, successDuration);
    return () => {
      clearTimeout(timer);
      setSettledFor(undefined);
    };
  }, [state, successDuration, onSuccessEnd]);

  useEffect(() => {
    if (state === "error" && motion === "full") ref.current?.animate?.(SHAKE, 320);
  }, [state, motion]);

  // Width and padding move only at full motion; reduced keeps the fades, none snaps.
  const fade = motion === "none" ? "" : "duration-[var(--duration-base)] ease-out";
  const grow = motion === "full" ? "duration-[var(--duration-base)] ease-out" : "duration-0";

  return (
    <>
      <HeroButton
        {...rest}
        ref={ref}
        variant={variant === "glass" ? "ghost" : variant}
        size={size}
        isDisabled={isDisabled ?? false}
        fullWidth={isFullWidth ?? false}
        data-state={shown}
        isPending={shown === "loading"}
        {...(takesPress && onPress ? { onPress } : {})}
        className={
          cn(
            variant === "glass" && "button--glass",
            "h-[var(--morph-h)] gap-0 data-[pending=true]:opacity-100 transition-[padding,border-radius,background-color,color,border-color] motion-reduce:transition-none",
            ROUND[size],
            motion === "full" ? grow : fade,
            // The round states are a true circle whatever the theme's button radius.
            isRound && "rounded-[calc(var(--morph-h)/2)] px-0",
            shown === "success" &&
              (isSolid
                ? "[--button-bg-hover:var(--success)] [--button-bg-pressed:var(--success)] [--button-bg:var(--success)] [--button-fg:var(--success-foreground)]"
                : "text-success"),
            shown === "error" &&
              (isSolid
                ? "[--button-bg-hover:var(--danger)] [--button-bg-pressed:var(--danger)] [--button-bg:var(--danger)] [--button-fg:var(--danger-foreground)]"
                : "text-danger"),
            className,
          ) ?? ""
        }
      >
        {/* The round states' marks, stacked in one cell and cross-faded; the cell is as wide as the button is tall. */}
        <span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden transition-[width] motion-reduce:transition-none [grid-template-areas:'mark']",
            grow,
            isRound ? "w-[var(--morph-h)]" : "w-0",
          )}
        >
          <span
            className={cn(
              "transition-[opacity,scale] motion-reduce:transition-none [grid-area:mark]",
              fade,
              shown === "loading" ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          >
            <Spinner color="current" size="sm" />
          </span>
          <span
            className={cn(
              "transition-[opacity,scale] motion-reduce:transition-none [grid-area:mark]",
              fade,
              shown === "success" ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          >
            <Icon name="check" />
          </span>
        </span>
        {/* The words: their grid column closes to nothing in the round states, which is what narrows the button. */}
        <span
          className={cn(
            "grid transition-[grid-template-columns,opacity] motion-reduce:transition-none",
            grow,
            isRound ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="min-w-0 overflow-hidden whitespace-nowrap">{words}</span>
        </span>
      </HeroButton>
      <span className="sr-only" aria-live="polite">
        {shown === "idle" ? "" : words}
      </span>
    </>
  );
}
