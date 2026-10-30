/**
 * Stackra file contract:
 * Purpose: the web `SetupGuide`, an onboarding checklist card on the house Card: the title, a progress bar of the tasks
 *          done, a show/hide button and the tasks as Checkboxes, each with its call to action while it is open. At 100%
 *          a "done" line pops in and an uncontrolled guide folds its list away.
 * Boundary: no styling of its own beyond the layout. The tasks are the app's: ticking one only calls
 *           `onCompleteChange`. The check draws on through HeroUI's own Checkbox indicator and the bar fills through
 *           the house ProgressBar; the list folds and the done line pops on Motion with the theme's `base` and `reveal`
 *           steps. Reduced motion does each at once and skips the pop. The card is a region named by its title; the
 *           toggle carries `aria-expanded` and `aria-controls`; the progress is a named progressbar.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); WCAG 2.2 SC 1.3.1,
 *          2.3.3, 4.1.2; design-system gap inventory row 17.
 */
import type { ReactElement } from "react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

import { SETUP_GUIDE_KEYS } from "#core/constants/setup-guide-keys.constant";
import { Button } from "#react/button/button";
import { Card } from "#react/card/card";
import { Checkbox } from "#react/checkbox/checkbox";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import { Text } from "#react/text/text";
import type { SetupGuideProps } from "#react/setup-guide/setup-guide.props";

const BASE = motionTiming(STACKRA_THEME, "base");
const REVEAL = motionTiming(STACKRA_THEME, "reveal");

/** The folded list: no height, no opacity. */
const FOLDED = { height: 0, opacity: 0 } as const;

/** An onboarding checklist with its progress, folding away once every task is done. */
export function SetupGuide({
  title,
  description,
  tasks,
  onCompleteChange,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  progressLabel,
  completeLabel,
  toggleLabel,
  ...rest
}: SetupGuideProps): ReactElement {
  const t = useUiText();
  const keys = SETUP_GUIDE_KEYS.ui.setup_guide;
  const id = useId();
  const isReduced = useReducedMotion() ?? false;
  const done = tasks.filter((task) => task.isComplete).length;
  const total = tasks.length;
  const isComplete = total > 0 && done === total;
  const [held, setHeld] = useState(defaultExpanded ?? !isComplete);
  const expanded = isExpanded ?? held;
  const [wasComplete, setWasComplete] = useState(isComplete);

  // Reaching 100% folds an uncontrolled list, adjusted during render; a guide that starts complete is already folded.
  if (isComplete !== wasComplete) {
    setWasComplete(isComplete);
    if (isComplete) setHeld(false);
  }

  const toggle = () => {
    setHeld(!expanded);
    onExpandedChange?.(!expanded);
  };
  const progress = progressLabel?.(done, total) ?? t(keys.progress, { done, total });
  const fold = { duration: BASE.durationMs / 1000, ease: BASE.bezier ?? "easeInOut" } as const;

  return (
    <Card {...rest} role="region" aria-labelledby={`${id}-title`}>
      <Card.Header className="flex-row items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-1">
          <Card.Title id={`${id}-title`} level={2}>
            {title}
          </Card.Title>
          {description ? <Card.Description>{description}</Card.Description> : null}
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={isReduced ? { duration: 0 } : fold}
        >
          <IconButton
            icon="chevron-down"
            size="sm"
            variant="ghost"
            label={toggleLabel?.(expanded) ?? t(expanded ? keys.hide : keys.show)}
            aria-expanded={expanded}
            aria-controls={`${id}-tasks`}
            onPress={toggle}
          />
        </motion.span>
      </Card.Header>
      <Card.Content className="grid gap-3">
        <ProgressBar
          value={done}
          maxValue={Math.max(total, 1)}
          size="sm"
          tone={isComplete ? "success" : "accent"}
          label={progress}
          valueLabel={progress}
          isLabelVisible
        />
        <AnimatePresence initial={false}>
          {isComplete ? (
            <motion.div
              key="complete"
              className="flex items-center gap-2"
              initial={isReduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: REVEAL.durationMs / 1000,
                ease: REVEAL.bezier ?? "easeOut",
              }}
            >
              <Icon name="circle-check" tone="success" />
              <Text type="small" tone="success" className="font-medium">
                {completeLabel ?? t(keys.complete)}
              </Text>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.ul
              key="tasks"
              id={`${id}-tasks`}
              className="grid gap-3 overflow-hidden"
              initial={isReduced ? false : FOLDED}
              animate={{ height: "auto", opacity: 1 }}
              {...(isReduced ? {} : { exit: FOLDED })}
              transition={fold}
            >
              {tasks.map((task) => (
                <li key={task.id} className="flex flex-wrap items-start justify-between gap-2">
                  <Checkbox
                    label={task.title}
                    description={task.description}
                    value={task.isComplete}
                    isReadOnly={onCompleteChange === undefined}
                    onChange={(next) => onCompleteChange?.(task.id, next)}
                  />
                  {!task.isComplete && task.onAction && task.actionLabel ? (
                    <Button size="sm" variant="secondary" onPress={task.onAction}>
                      {task.actionLabel}
                    </Button>
                  ) : null}
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </Card.Content>
    </Card>
  );
}
