/**
 * Stackra file contract:
 * Purpose: `DrawerHandle`, the resize handle of a native bottom drawer with two or more snap points: the grab bar at the
 *          top of the sheet, which a drag moves between the snap points, and which screen readers reach as one
 *          adjustable element (VoiceOver swipes up or down, TalkBack's increase and decrease) that steps the sheet one
 *          snap point taller or shorter; a double tap moves to the next one, back to the first after the last.
 * Boundary: drawn by `@gorhom/bottom-sheet` as the sheet's `handleComponent`, so the drag is its own pan gesture on
 *           this element; the steps call the sheet's `snapToIndex` through `DrawerSnapContext`. The value is spoken as
 *           the snap point's position among them. The move animates only without
 *           the system's Reduce motion (`@gorhom/bottom-sheet`'s `overrideReduceMotion`, `ReduceMotion.System` by default). Outside a snap drawer it draws the bar alone.
 * Runtime: react-native
 * Governing contract: STA-1371 (drawer resize on native); ADR 0303 (decision 7); WCAG 2.2 SC 2.5.7 (a
 *          single-pointer alternative to dragging) and 4.1.2.
 */
import { use, type ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { DrawerSnapContext } from "#native/drawer/drawer-snap-context";

/** The grab bar a drag or a screen reader resizes the sheet with. */
export function DrawerHandle(): ReactElement {
  const t = useUiText();
  const snap = use(DrawerSnapContext);
  const bar = <View className="h-1 w-10 rounded-[var(--radius-pill)] bg-muted opacity-40" />;
  if (!snap) return <View className="items-center py-3">{bar}</View>;
  const { index, count, snapTo } = snap;
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t(UI_KEYS.ui.drawer.resize)}
      accessibilityValue={{ min: 1, max: count, now: index + 1 }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }, { name: "activate" }]}
      onAccessibilityAction={(event) => {
        const action = event.nativeEvent.actionName;
        snapTo(
          action === "increment"
            ? index + 1
            : action === "decrement"
              ? index - 1
              : (index + 1) % count,
        );
      }}
      // 44 points tall, the touch target the drag starts from.
      className="min-h-11 items-center justify-center"
    >
      {bar}
    </View>
  );
}
