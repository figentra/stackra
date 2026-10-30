/**
 * Stackra file contract:
 * Purpose: the native `TreeView`: nested rows that expand and collapse, with none, one or several selected. Each row
 *          is a pressable that selects (or activates, without selection) with its state read out (selected, disabled,
 *          its level in the label's hint), and a parent row has its own chevron button that expands it, named
 *          "Expand <row>" or "Collapse <row>". The chevron turns a quarter towards the children, mirrored in a
 *          right-to-left layout, and the children fade and stagger in.
 * Boundary: the selection and the expanded set are controlled or uncontrolled and reported in the order the rows are
 *           listed. The rotation and stagger are Reanimated's and are left out under reduce motion. A tree long enough
 *           to need virtualising is the app's FlatList of the flattened rows; this draws every open row.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); design-system gap
 *          inventory (2026-10-28) row 22.
 */
import { useEffect, useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TreeViewProps } from "#native/tree-view/tree-view.props";

/** The delay between two children fading in, in milliseconds. */
const STAGGER_MS = 30;

/** How long the chevron takes to turn, in milliseconds. */
const TURN_MS = 200;

/** The indent of each level, in points. */
const INDENT = 20;

/** Every id of the tree, depth first, in the order the rows are listed. */
const idsOf = (nodes: readonly TreeViewNode[]): string[] =>
  nodes.flatMap((node) => [node.id, ...idsOf(node.children ?? [])]);

/** A list held in props or in state: the controlled value wins. */
function useKeys(
  value: readonly string[] | undefined,
  initial: readonly string[] | undefined,
  onChange: ((keys: readonly string[]) => void) | undefined,
): [readonly string[], (keys: readonly string[]) => void] {
  const [own, setOwn] = useState<readonly string[]>(initial ?? []);
  return [
    value ?? own,
    (keys) => {
      if (value === undefined) setOwn(keys);
      onChange?.(keys);
    },
  ];
}

/** The chevron of a parent row, turned a quarter while it is expanded. */
function Chevron({ isExpanded }: { readonly isExpanded: boolean }): ReactElement {
  const { direction } = useDesignSystem();
  const isReduced = useReducedMotion();
  // A right chevron turns down to open; in right-to-left it starts pointing left.
  const angle = isExpanded ? 90 : direction === "rtl" ? 180 : 0;
  const turn = useSharedValue(angle);
  useEffect(() => {
    turn.set(isReduced ? angle : withTiming(angle, { duration: TURN_MS }));
  }, [angle, isReduced, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));
  return (
    <Animated.View style={style}>
      <Icon name="chevron-right" size="sm" />
    </Animated.View>
  );
}

/** Nested rows that expand and collapse, with optional selection. */
export function TreeView({
  items,
  label,
  selectionMode = "none",
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  onAction,
  ...rest
}: TreeViewProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const order = idsOf(items);
  const [selected, setSelected] = useKeys(selectedKeys, defaultSelectedKeys, onSelectionChange);
  const [expanded, setExpanded] = useKeys(expandedKeys, defaultExpandedKeys, onExpandedChange);
  const inOrder = (keys: ReadonlySet<string>) => order.filter((id) => keys.has(id));

  const toggle = (keys: readonly string[], id: string) => {
    const next = new Set(keys);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return inOrder(next);
  };

  const press = (node: TreeViewNode) => {
    if (selectionMode === "none") {
      onAction?.(node.id);
      return;
    }
    haptics.play("selection");
    setSelected(
      selectionMode === "single"
        ? selected.includes(node.id)
          ? []
          : [node.id]
        : toggle(selected, node.id),
    );
  };

  const renderNode = (node: TreeViewNode, level: number, index: number): ReactElement => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded = expanded.includes(node.id);
    const isSelected = selected.includes(node.id);
    return (
      <Animated.View
        key={node.id}
        {...(isReduced || level === 1 ? {} : { entering: FadeInDown.delay(index * STAGGER_MS) })}
      >
        <View
          className={`min-h-11 flex-row items-center gap-2 pe-3 ${isSelected ? "bg-accent-soft" : ""}`}
          style={{ paddingStart: (level - 1) * INDENT + 8 }}
        >
          {hasChildren ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                isExpanded ? UI_KEYS.ui.tree_view.collapse : UI_KEYS.ui.tree_view.expand,
                { label: node.label },
              )}
              accessibilityState={{ expanded: isExpanded }}
              hitSlop={8}
              className="size-7 items-center justify-center"
              onPress={() => setExpanded(toggle(expanded, node.id))}
            >
              <Chevron isExpanded={isExpanded} />
            </Pressable>
          ) : (
            <View className="size-7" />
          )}
          <Pressable
            accessibilityRole={selectionMode === "multiple" ? "checkbox" : "button"}
            accessibilityLabel={node.label}
            accessibilityState={{
              disabled: node.isDisabled ?? false,
              ...(selectionMode === "none"
                ? {}
                : selectionMode === "multiple"
                  ? { checked: isSelected }
                  : { selected: isSelected }),
            }}
            disabled={node.isDisabled ?? false}
            className={`min-h-11 flex-1 flex-row items-center gap-2 ${node.isDisabled ? "opacity-50" : ""}`}
            onPress={() => press(node)}
          >
            <SlotIcon icon={node.icon} />
            <Text isTruncated className="flex-1">
              {node.label}
            </Text>
            {node.description ? <Text tone="muted">{node.description}</Text> : null}
          </Pressable>
        </View>
        {hasChildren && isExpanded
          ? node.children?.map((child, childIndex) => renderNode(child, level + 1, childIndex))
          : null}
      </Animated.View>
    );
  };

  return (
    <View {...rest} accessibilityLabel={label}>
      {items.map((node, index) => renderNode(node, 1, index))}
    </View>
  );
}
