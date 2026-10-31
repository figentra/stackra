/**
 * Stackra file contract:
 * Purpose: the web `SaveBar`, the contextual save bar of a dirty form: a named region on the house Card, sticky at the
 *          foot of its scroll container, with the message, any extra content (usually a `SaveStatus`), Discard and
 *          Save. It slides up when `isDirty` turns true and down when it turns false, and shakes when `attentionKey`
 *          changes, on Motion with the theme's `base` step.
 * Boundary: no styling of its own beyond the sticky placement and the row layout. The message is announced politely
 *           once when the bar appears, through a live region that is always in the page. Save is busy while
 *           `isSaving` or while the promise `onSave` returned is pending, and refuses a second press; a rejection is
 *           the app's to report. Reduced motion shows and hides the bar at once and skips the shake. The bar unmounts
 *           once the form is clean, which drops focus held on its buttons, so the app moves focus on (to the form).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); ADR 0139 (action UX);
 *          WCAG 2.2 SC 2.3.3, 4.1.2, 4.1.3; design-system gap inventory row 8.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { SAVE_BAR_KEYS } from "#core/constants/save-bar-keys.constant";
import { Button } from "#react/button/button";
import { Card } from "#react/card/card";
import { useUiText } from "#react/hooks/use-ui-text";
import { Text } from "#react/text/text";
import type { SaveBarProps } from "#react/save-bar/save-bar.props";

const BASE = motionTiming(STACKRA_THEME, "base");
const REVEAL = motionTiming(STACKRA_THEME, "reveal");

/** Where the bar rests while it slides in or out: below its own edge. */
const HIDDEN = { y: "100%", opacity: 0 } as const;

/** The shake that calls the eye to the bar, in px along the inline axis. */
const SHAKE = [0, -8, 8, -6, 6, -3, 0];

/** The bar that asks to save or discard a dirty form. */
export function SaveBar({
  isDirty,
  onSave,
  onDiscard,
  isSaving = false,
  isSaveDisabled,
  attentionKey,
  message: messageProp,
  saveLabel,
  discardLabel,
  label,
  children,
  className,
  ...rest
}: SaveBarProps): ReactElement {
  const t = useUiText();
  const keys = SAVE_BAR_KEYS.ui.save_bar;
  const message = messageProp ?? t(keys.message);
  const isReduced = useReducedMotion() ?? false;
  const [isRunning, setIsRunning] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const seen = useRef(attentionKey);

  // A new attention key shakes the bar, when it is there to shake and motion is welcome.
  useEffect(() => {
    if (attentionKey === seen.current) return;
    seen.current = attentionKey;
    if (!isReduced && scope.current)
      void animate(scope.current, { x: SHAKE }, { duration: REVEAL.durationMs / 1000 });
  }, [attentionKey, isReduced, animate, scope]);

  const save = () => {
    const result = onSave();
    if (!(result instanceof Promise)) return;
    setIsRunning(true);
    const settle = () => setIsRunning(false);
    void result.then(settle, settle);
  };

  return (
    <div {...rest} className={cn("sticky bottom-0 z-(--z-raised)", className)}>
      {/* Present before it speaks, so the bar's arrival, not the page's load, is what is announced. */}
      <div role="status" className="sr-only">
        {isDirty ? message : ""}
      </div>
      <AnimatePresence initial={false}>
        {isDirty ? (
          <motion.div
            key="save-bar"
            initial={isReduced ? false : HIDDEN}
            animate={{ y: 0, opacity: 1 }}
            {...(isReduced ? {} : { exit: HIDDEN })}
            transition={{ duration: BASE.durationMs / 1000, ease: BASE.bezier ?? "easeInOut" }}
          >
            <div ref={scope}>
              <Card
                role="region"
                aria-label={label ?? t(keys.label)}
                className="flex-row flex-wrap items-center gap-3 p-3"
              >
                <Text type="small" className="min-w-0 flex-1 font-medium">
                  {message}
                </Text>
                {children}
                <Button size="sm" variant="ghost" onPress={onDiscard}>
                  {discardLabel ?? t(keys.discard)}
                </Button>
                <Button
                  size="sm"
                  isLoading={isSaving || isRunning}
                  isDisabled={isSaveDisabled === true}
                  onPress={save}
                >
                  {saveLabel ?? t(keys.save)}
                </Button>
              </Card>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
