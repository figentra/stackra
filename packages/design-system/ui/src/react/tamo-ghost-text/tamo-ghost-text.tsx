/**
 * Stackra file contract:
 * Purpose: the web `TamoGhostText`: Tamo's suggestion drawn in muted text right after the field's own text, over the
 *          first input or text area inside it; Tab accepts it, Escape dismisses it, and a live region reads it with
 *          those keys.
 * Boundary: the field stays the person's: the overlay is decorative (`aria-hidden`, no pointer events) and nothing
 *           changes until Tab. It copies the field's box and font so the ghost lines up, in either direction.
 * Runtime: browser
 * Governing contract: ADR 0507 (ghost suggestion text); ADR 0021; WCAG 2.2 SC 2.1.1, 4.1.3.
 */
import { cn } from "@heroui/react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
} from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TamoGhostTextProps } from "#react/tamo-ghost-text/tamo-ghost-text.props";

/** The field's styles the overlay copies, so its text lines up with the field's. */
const COPIED = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "direction",
  "textAlign",
] as const;

/** Tamo's suggestion as ghost text over a field. */
export function TamoGhostText({
  children,
  value,
  suggestion,
  onAccept,
  onDismiss,
  className,
}: TamoGhostTextProps): ReactElement {
  const t = useUiText();
  const root = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    const field = root.current?.querySelector<HTMLElement>("textarea, input");
    if (!root.current || !field || suggestion === "") {
      setBox(null);
      return;
    }
    const style = getComputedStyle(field);
    const outer = root.current.getBoundingClientRect();
    const inner = field.getBoundingClientRect();
    // shortcut: the overlay ignores the field's own scroll, so a long text area scrolled up shows the ghost off-line;
    // follow `scrollTop` when a field that scrolls needs ghost text.
    setBox({
      ...Object.fromEntries(COPIED.map((name) => [name, style[name]])),
      top: inner.top - outer.top,
      left: inner.left - outer.left,
      width: inner.width,
      height: inner.height,
      borderStyle: "solid",
      borderColor: "transparent",
      whiteSpace: field instanceof HTMLTextAreaElement ? "pre-wrap" : "pre",
    });
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- reason: a new value moves the field's text, so the ghost is measured again
  }, [suggestion, value]);

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    const isField =
      event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
    if (suggestion === "" || !isField) return;
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      onAccept(value + suggestion);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onDismiss();
    }
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: the keys reach the field inside; the wrapper only listens on their way
    <div
      ref={root}
      data-slot="tamo-ghost-text"
      className={cn("relative", className) ?? ""}
      onKeyDownCapture={onKeyDownCapture}
    >
      {children}
      {box ? (
        <div aria-hidden className="pointer-events-none absolute overflow-hidden" style={box}>
          <span className="invisible">{value}</span>
          <span className="text-muted">{suggestion}</span>
        </div>
      ) : null}
      <span role="status" className="sr-only">
        {suggestion === "" ? "" : t(TAMO_KEYS.ui.tamo.suggestion, { text: suggestion })}
      </span>
    </div>
  );
}
