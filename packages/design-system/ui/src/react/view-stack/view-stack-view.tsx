/**
 * Stackra file contract:
 * Purpose: one web `ViewStack.View`: a named region drawn only while it is the view on top of its stack.
 * Boundary: a `section` named by `label`; once the stack has moved, the view that appears takes focus (it is focusable
 *           from code only), so a keyboard and screen-reader user lands on the new content.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.4.3 and 4.1.2.
 */
import { type ReactElement, use, useEffect, useRef } from "react";

import { ViewStackContext } from "#react/view-stack/view-stack-context";
import type { ViewStackViewProps } from "#react/view-stack/view-stack-view.props";

/** One view of a stack. */
export function ViewStackView({ id, label, children }: ViewStackViewProps): ReactElement | null {
  const value = use(ViewStackContext);
  const isShown = value?.state.current === id;
  const hasMoved = value?.hasMoved ?? false;
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isShown && hasMoved) ref.current?.focus({ preventScroll: true });
  }, [isShown, hasMoved]);
  if (!isShown) return null;
  return (
    <section
      ref={ref}
      aria-label={label}
      tabIndex={-1}
      className="outline-none"
      data-slot="view-stack-view"
    >
      {children}
    </section>
  );
}
