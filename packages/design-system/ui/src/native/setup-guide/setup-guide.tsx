/**
 * Stackra file contract:
 * Purpose: the native `SetupGuide`, an onboarding checklist card on the house Card: the title, a progress bar of the
 *          tasks done, a show/hide button and the tasks as Checkboxes, each with its call to action while it is open.
 *          At 100% a "done" line springs in, a success haptic plays and an uncontrolled guide folds its list away.
 * Boundary: no styling of its own beyond the layout. The tasks are the app's: ticking one only calls
 *           `onCompleteChange` (the house Checkbox plays its selection tick and draws its own check). The bar fills
 *           through the house ProgressBar; the chevron turns, the list fades and the done line springs on
 *           react-native-reanimated. The system's reduce-motion setting does each at once and skips the spring. The
 *           toggle reports `expanded` in its accessibility state.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); WCAG 2.2 SC 2.3.3,
 *          4.1.2; design-system gap inventory row 17.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { SETUP_GUIDE_KEYS } from "#core/constants/setup-guide-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Card } from "#native/card/card";
import { Checkbox } from "#native/checkbox/checkbox";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import { Text } from "#native/text/text";
import type { SetupGuideProps } from "#native/setup-guide/setup-guide.props";

const BASE = motionTiming(STACKRA_THEME, "base");
const SHOW = FadeIn.duration(BASE.durationMs).reduceMotion(ReduceMotion.System);
const HIDE = FadeOut.duration(BASE.durationMs).reduceMotion(ReduceMotion.System);
const CELEBRATE = ZoomIn.springify().reduceMotion(ReduceMotion.System);

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
  const isReduced = useReducedMotion();
  const done = tasks.filter((task) => task.isComplete).length;
  const total = tasks.length;
  const isComplete = total > 0 && done === total;
  const [held, setHeld] = useState(defaultExpanded ?? !isComplete);
  const expanded = isExpanded ?? held;
  const turn = useSharedValue(expanded ? 180 : 0);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));

  // The chevron turns to point at the list's new state, at once under reduced motion.
  useEffect(() => {
    const to = expanded ? 180 : 0;
    turn.set(isReduced ? to : withTiming(to, { duration: BASE.durationMs }));
  }, [expanded, isReduced, turn]);

  // Reaching 100% folds an uncontrolled list, adjusted during render; a guide that starts complete is already folded.
  const [wasComplete, setWasComplete] = useState(isComplete);
  if (isComplete !== wasComplete) {
    setWasComplete(isComplete);
    if (isComplete) setHeld(false);
  }

  // Reaching 100% is felt once.
  const felt = useRef(isComplete);
  useEffect(() => {
    if (isComplete && !felt.current) haptics.play("success");
    felt.current = isComplete;
  }, [isComplete]);

  const toggle = () => {
    setHeld(!expanded);
    onExpandedChange?.(!expanded);
  };
  const progress = progressLabel?.(done, total) ?? t(keys.progress, { done, total });

  return (
    <Card {...rest}>
      <Card.Header className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Card.Title level={2}>{title}</Card.Title>
          {description ? <Card.Description>{description}</Card.Description> : null}
        </View>
        <Animated.View style={chevron}>
          <IconButton
            icon="chevron-down"
            size="sm"
            variant="ghost"
            label={toggleLabel?.(expanded) ?? t(expanded ? keys.hide : keys.show)}
            accessibilityState={{ expanded }}
            onPress={toggle}
          />
        </Animated.View>
      </Card.Header>
      <Card.Content className="gap-3">
        <ProgressBar
          value={done}
          maxValue={Math.max(total, 1)}
          size="sm"
          tone={isComplete ? "success" : "accent"}
          label={progress}
          valueLabel={progress}
          isLabelVisible
        />
        {isComplete ? (
          <Animated.View entering={CELEBRATE} className="flex-row items-center gap-2">
            <Icon name="circle-check" tone="success" />
            <Text type="small" tone="success" className="font-medium">
              {completeLabel ?? t(keys.complete)}
            </Text>
          </Animated.View>
        ) : null}
        {expanded ? (
          <Animated.View entering={SHOW} exiting={HIDE} className="gap-3">
            {tasks.map((task) => (
              <View key={task.id} className="gap-2">
                <Checkbox
                  label={task.title}
                  description={task.description}
                  value={task.isComplete}
                  isReadOnly={onCompleteChange === undefined}
                  onChange={(next) => onCompleteChange?.(task.id, next)}
                />
                {!task.isComplete && task.onAction && task.actionLabel ? (
                  <View className="flex-row">
                    <Button size="sm" variant="secondary" onPress={task.onAction}>
                      {task.actionLabel}
                    </Button>
                  </View>
                ) : null}
              </View>
            ))}
          </Animated.View>
        ) : null}
      </Card.Content>
    </Card>
  );
}
