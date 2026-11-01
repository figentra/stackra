/**
 * Stackra file contract:
 * Purpose: the web `TamoButton`: the Tamo action button, a pill with a brand-gradient glow border (`--tamo-glow-*`)
 *          and Tamo's mark, a shimmer sweeping round the border while working, three sizes, and an icon-only form
 *          for inside fields. It is a React Aria button, so it also triggers a Menu or a Popover.
 * Boundary: draws and reports presses; it runs no task. Working, it is `aria-busy` and the mark scans; under reduced
 *           motion the shimmer and the scan stop and only the words say it is working.
 * Runtime: browser
 * Governing contract: ADR 0507 (decisions 4 and 6); ADR 0165 (React Aria on web); WCAG 2.2 SC 2.1.1, 2.3.3, 2.4.7,
 *          2.5.8, 4.1.2.
 */
import { cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactElement } from "react";
import { Button as AriaButton } from "react-aria-components";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoMark } from "#react/tamo-mark/tamo-mark";
import type { TamoButtonProps } from "#react/tamo-button/tamo-button.props";

/** The brand gradient, repeated so a 200% background loops. */
const GLOW =
  "linear-gradient(90deg, var(--tamo-glow-start), var(--tamo-glow-mid), var(--tamo-glow-end), var(--tamo-glow-mid), var(--tamo-glow-start))";
/** The working sweep: one bright band. */
const SHIMMER = "linear-gradient(90deg, transparent 35%, var(--tamo-shimmer) 50%, transparent 65%)";

/** The inner pill's box by size. */
const BOX = {
  sm: "h-7 gap-1 px-2.5 text-xs",
  md: "h-8 gap-1.5 px-3 text-sm",
  lg: "h-10 gap-2 px-4 text-base",
} as const;
/** The icon-only box by size. */
const ICON_BOX = { sm: "size-7", md: "size-8", lg: "size-10" } as const;

/** The shimmer's period in seconds: the theme's `--duration-tamo-shimmer`, else 1.6. */
function shimmerSeconds(): number {
  if (typeof document === "undefined") return 1.6;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--duration-tamo-shimmer")
    .trim();
  const ms = Number.parseFloat(value);
  return Number.isFinite(ms) && ms > 0 ? (value.endsWith("ms") ? ms / 1000 : ms) : 1.6;
}

/** The Tamo action button. */
export function TamoButton({
  label,
  isIconOnly = false,
  size = "md",
  status = "idle",
  isDisabled,
  onPress,
  className,
  ref,
  "aria-keyshortcuts": keyShortcuts,
  "aria-description": description,
  ...rest
}: TamoButtonProps & {
  readonly "aria-keyshortcuts"?: string | undefined;
  readonly "aria-description"?: string | undefined;
}): ReactElement {
  const t = useUiText();
  const name = label ?? t(TAMO_KEYS.ui.tamo.ask);
  const isWorking = status === "working";
  const isReduced = useReducedMotion() ?? false;
  const [seconds] = useState(shimmerSeconds);
  return (
    <AriaButton
      {...rest}
      {...(onPress === undefined ? {} : { onPress })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(isIconOnly ? { "aria-label": name } : {})}
      // React Aria's button keeps only the ARIA props it knows, so these three are set on the element itself.
      ref={(node: HTMLButtonElement | null) => {
        if (typeof ref === "function") ref(node);
        // oxlint-disable-next-line eslint/no-param-reassign -- reason: forwarding the caller's ref object is its contract
        else if (ref) ref.current = node;
        if (!node) return;
        const set = (attribute: string, value: string | undefined) =>
          value === undefined
            ? node.removeAttribute(attribute)
            : node.setAttribute(attribute, value);
        set("aria-busy", isWorking ? "true" : undefined);
        set("aria-keyshortcuts", keyShortcuts);
        set("aria-description", description);
      }}
      data-slot="tamo-button"
      data-status={status}
      className={
        cn(
          "group/tamo relative isolate inline-flex shrink-0 cursor-pointer rounded-[var(--radius-pill)] p-px outline-none",
          "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-default disabled:opacity-50 data-[hovered]:brightness-110 data-[pressed]:brightness-95",
          className,
        ) ?? ""
      }
      style={{ backgroundImage: GLOW, backgroundSize: "200% 100%" }}
    >
      <span
        aria-hidden
        className={
          cn(
            "pointer-events-none absolute -inset-0.5 rounded-[var(--radius-pill)] blur-sm transition-opacity",
            isWorking ? "opacity-60" : "opacity-30 group-data-[hovered]/tamo:opacity-50",
          ) ?? ""
        }
        style={{ backgroundImage: GLOW }}
      />
      {isWorking && !isReduced ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-pill)]"
          style={{ backgroundImage: SHIMMER, backgroundSize: "200% 100%" }}
          initial={{ backgroundPositionX: "150%" }}
          animate={{ backgroundPositionX: "-50%" }}
          // oxlint-disable-next-line stackra/no-literal-duration -- reason: a looping sweep needs constant speed to join seamlessly
          transition={{ duration: seconds, repeat: Infinity, ease: "linear" }}
        />
      ) : null}
      <span
        className={
          cn(
            "relative inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-surface font-medium text-foreground",
            isIconOnly ? ICON_BOX[size] : BOX[size],
          ) ?? ""
        }
      >
        <TamoMark size={size === "lg" ? "md" : "sm"} status={status} />
        {isIconOnly ? null : <span className="whitespace-nowrap">{name}</span>}
      </span>
    </AriaButton>
  );
}
