/**
 * Stackra file contract:
 * Purpose: the web `Truncate`: text clamped to `lines`; when it is really cut, `expand` adds a Show more / Show less
 *          button and `tooltip` makes the text focusable with the whole of it in a tooltip on hover and focus.
 * Boundary: the cut is measured (scroll height against client height) and re-measured on resize. The button says
 *           whether the text is open (`aria-expanded`) and points at it (`aria-controls`). Line clamping never splits
 *           letters, so Arabic stays joined.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.4.13, 2.1.1 and 4.1.2; STA-1371.
 */
import { Tooltip, cn } from "@heroui/react";
import { useId, useLayoutEffect, useRef, useState, type ReactElement } from "react";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TruncateProps } from "#react/truncate/truncate.props";

/** The truncate's keys. */
const K = DISPLAY_KEYS.ui.truncate;

/** Clamped text that can open. */
export function Truncate({
  children,
  lines = 3,
  mode = "expand",
  defaultExpanded = false,
  className,
}: TruncateProps): ReactElement {
  const t = useUiText();
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [isOpen, setOpen] = useState(defaultExpanded);
  const [isCut, setCut] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setCut(element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- new text, lines or state must be measured again
  }, [children, lines, isOpen]);
  const clamp = isOpen
    ? undefined
    : {
        WebkitLineClamp: lines,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
      };
  const text = (
    <p ref={ref} id={id} dir="auto" style={clamp} className="m-0">
      {children}
    </p>
  );
  if (mode === "tooltip")
    return (
      <div data-slot="truncate" className={cn("min-w-0", className)}>
        <Tooltip isDisabled={!isCut}>
          <Tooltip.Trigger className="rounded-[var(--radius-control)] outline-none focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus">
            {text}
          </Tooltip.Trigger>
          <Tooltip.Content className="max-w-sm">{children}</Tooltip.Content>
        </Tooltip>
      </div>
    );
  return (
    <div data-slot="truncate" className={cn("grid min-w-0 justify-items-start gap-1", className)}>
      {text}
      {isCut || isOpen ? (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={id}
          onClick={() => setOpen(!isOpen)}
          className="min-h-6 rounded-[var(--radius-control)] text-sm font-medium text-accent-soft-foreground underline-offset-2 outline-none hover:underline focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus"
        >
          {t(isOpen ? K.less : K.more)}
        </button>
      ) : null}
    </div>
  );
}
