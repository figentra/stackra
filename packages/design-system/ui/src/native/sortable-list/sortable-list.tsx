/**
 * Stackra file contract:
 * Purpose: the native `SortableList`: rows reordered by dragging their grip handle, or by the "Move up" and "Move
 *          down" accessibility actions VoiceOver and TalkBack offer on each row, with the new position announced. The
 *          picked-up row lifts (scale 1.02 and a shadow) and follows the finger, the rows it passes spring aside, and
 *          it settles with a spring on drop. A light impact haptic plays on pickup and a selection tick on each slot crossed.
 * Boundary: controlled only: a move calls `onReorder` with every row in the new order. The drag is React Native's
 *           PanResponder driving Reanimated shared values; rows are assumed to be the same height (the first row's
 *           measured height). Under reduce motion the rows move without springs. Haptics go through `haptics`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); design-system gap
 *          inventory (2026-10-28) row 10; WCAG 2.2 SC 2.5.7 (a single-pointer alternative to dragging).
 */
// shortcut: PanResponder on the JS thread, because react-native-gesture-handler is not a dependency of this package;
// move the pan to a Gesture Handler `Gesture.Pan()` on the UI thread once it is added.
import { motionSpring, STACKRA_THEME } from "@stackra/tokens";
import { useThemeColor } from "heroui-native";
import { useMemo, type ReactElement, type ReactNode } from "react";
import { AccessibilityInfo, PanResponder, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

import { THEME_PX } from "#core/constants/theme-px.constant";
import type { SortableListItem } from "#contracts/types/sortable-list-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { moveItem } from "#core/functions/move-item.function";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SortableListProps } from "#native/sortable-list/sortable-list.props";
import type { SortableRowAction } from "#native/sortable-list/sortable-row-action.type";

/** The theme's snappy spring, for a control or a drag settling. */
const SNAPPY = motionSpring(STACKRA_THEME, "snappy");

/** The scale of a picked-up row. */
const LIFT = 1.02;

/** The drag state every row reads: which row is held, which slot it is over, how far it moved, and a row's height. */
interface DragState {
  readonly active: SharedValue<number>;
  readonly hover: SharedValue<number>;
  readonly dragY: SharedValue<number>;
  readonly rowHeight: SharedValue<number>;
}

/** The props of one row. */
interface SortableRowProps {
  readonly index: number;
  readonly count: number;
  readonly label: string;
  readonly isLocked: boolean;
  readonly drag: DragState;
  readonly onMove: (from: number, to: number) => void;
  readonly extraActions: readonly SortableRowAction[];
  readonly children: ReactNode;
}

/** One row: its handle starts a drag, and its accessibility actions move it by one. */
function SortableRow({
  index,
  count,
  label,
  isLocked,
  drag,
  onMove,
  extraActions,
  children,
}: SortableRowProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const shadow = useThemeColor("foreground");
  const { active, hover, dragY, rowHeight } = drag;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          active.set(index);
          hover.set(index);
          dragY.set(0);
          haptics.play("impact");
        },
        onPanResponderMove: (_event, gesture) => {
          dragY.set(gesture.dy);
          const height = rowHeight.get();
          if (height <= 0) return;
          const over = Math.min(count - 1, Math.max(0, index + Math.round(gesture.dy / height)));
          if (over !== hover.get()) {
            hover.set(over);
            haptics.play("selection");
          }
        },
        onPanResponderRelease: () => {
          const to = hover.get();
          active.set(-1);
          hover.set(-1);
          dragY.set(0);
          onMove(index, to);
        },
        onPanResponderTerminate: () => {
          active.set(-1);
          hover.set(-1);
          dragY.set(0);
        },
      }),
    // Rebuilt when the row moves; a drag never outlives its row, because the order changes only on release.
    [index, count, onMove, active, hover, dragY, rowHeight],
  );

  const style = useAnimatedStyle(() => {
    const held = active.get();
    const isHeld = held === index;
    const height = rowHeight.get();
    const over = hover.get();
    // The rows between the held row's slot and the slot it is over step aside by one row.
    const shift =
      held < 0 || isHeld
        ? 0
        : index > held && index <= over
          ? -height
          : index < held && index >= over
            ? height
            : 0;
    const spring = (to: number) => (isReduced || held < 0 ? to : withSpring(to, SNAPPY));
    return {
      zIndex: isHeld ? 1 : 0,
      shadowOpacity: isHeld ? 0.18 : 0,
      elevation: isHeld ? 6 : 0,
      transform: [
        { translateY: isHeld ? dragY.get() : spring(shift) },
        { scale: isReduced ? 1 : withSpring(isHeld ? LIFT : 1, SNAPPY) },
      ],
    };
  });

  const actions = [
    ...(index > 0 ? [{ name: "move_up", label: t(UI_KEYS.ui.sortable_list.move_up) }] : []),
    ...(index < count - 1
      ? [{ name: "move_down", label: t(UI_KEYS.ui.sortable_list.move_down) }]
      : []),
  ];
  const act = (actionName: string) => {
    const extra = extraActions.find((action) => action.name === actionName);
    if (extra) extra.onAction();
    else if (!isLocked) onMove(index, actionName === "move_up" ? index - 1 : index + 1);
  };
  const allActions = [
    ...(isLocked ? [] : actions),
    ...extraActions.map(({ name, label: actionLabel }) => ({ name, label: actionLabel })),
  ];

  return (
    <Animated.View
      onLayout={(event) => {
        if (index === 0) rowHeight.set(event.nativeEvent.layout.height);
      }}
      style={[
        style,
        // The lift's blur and drop on the spacing unit, so a denser theme lifts less.
        {
          shadowColor: shadow,
          shadowRadius: THEME_PX.spacing * 2,
          shadowOffset: { width: 0, height: THEME_PX.spacing },
        },
      ]}
      className="flex-row items-center gap-3 bg-surface px-2 py-2"
      accessible
      accessibilityLabel={label}
      {...(isLocked ? {} : { accessibilityHint: t(UI_KEYS.ui.sortable_list.hint) })}
      {...(allActions.length === 0
        ? {}
        : {
            accessibilityActions: allActions,
            onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) =>
              act(event.nativeEvent.actionName),
          })}
    >
      {isLocked ? null : (
        <View
          {...responder.panHandlers}
          hitSlop={8}
          className="size-10 items-center justify-center"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Icon name="grip-vertical" size="sm" tone="muted" />
        </View>
      )}
      <View className="flex-1">{children}</View>
    </Animated.View>
  );
}

/** Rows reordered by drag or by accessibility actions. */
export function SortableList<TItem extends SortableListItem>({
  items,
  onReorder,
  label,
  renderItem,
  isDisabled = false,
  accessibilityActionsOf,
  ...rest
}: SortableListProps<TItem>): ReactElement {
  const t = useUiText();
  const drag: DragState = {
    active: useSharedValue(-1),
    hover: useSharedValue(-1),
    dragY: useSharedValue(0),
    rowHeight: useSharedValue(0),
  };

  const move = (from: number, to: number) => {
    const next = moveItem(items, from, to);
    const item = items[from];
    if (next === items || item === undefined) return;
    onReorder(next);
    AccessibilityInfo.announceForAccessibility(
      t(UI_KEYS.ui.sortable_list.moved, {
        label: item.label,
        position: to + 1,
        count: items.length,
      }),
    );
  };

  return (
    <View {...rest} accessibilityRole="list" accessibilityLabel={label}>
      {items.map((item, index) => (
        <SortableRow
          key={item.id}
          index={index}
          count={items.length}
          label={item.label}
          isLocked={isDisabled || (item.isDisabled ?? false)}
          drag={drag}
          onMove={move}
          extraActions={accessibilityActionsOf?.(item) ?? []}
        >
          {renderItem ? (
            renderItem(item)
          ) : (
            <>
              <Text isTruncated>{item.label}</Text>
              {item.description ? (
                <Text tone="muted" isTruncated>
                  {item.description}
                </Text>
              ) : null}
            </>
          )}
        </SortableRow>
      ))}
    </View>
  );
}
