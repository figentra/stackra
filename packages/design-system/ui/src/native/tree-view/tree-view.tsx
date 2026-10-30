/**
 * Stackra file contract:
 * Purpose: the native `TreeView`: nested rows that expand and collapse, with none, one or several selected. Each row
 *          is a pressable that selects (or activates, without selection) with its state read out (selected, disabled,
 *          its level in the label's hint), and a parent row has its own chevron button that expands it, named
 *          "Expand <row>" or "Collapse <row>". A multiple tree draws a checkbox per row; with `isSelectionPropagated`
 *          a check carries down to every row under it and a partly checked parent shows a dash (read as mixed). A row
 *          marked `hasChildren` loads its rows through `onLoadChildren` the first time it opens, with a spinner row
 *          meanwhile. The chevron turns a quarter towards the children, mirrored in a right-to-left layout, and the
 *          children fade and stagger in. Rows are not dragged on native: `onMove` is ignored.
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
import { propagateTreeSelection } from "#core/functions/propagate-tree-selection.function";
import { treeCheckStateOf } from "#core/functions/tree-check-state-of.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Spinner } from "#native/spinner/spinner";
import { Text } from "#native/text/text";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TreeViewProps } from "#native/tree-view/tree-view.props";

/** The delay between two children fading in, in milliseconds. */
const STAGGER_MS = 30;

/** How long the chevron takes to turn, in milliseconds. */
const TURN_MS = 200;

/** The indent of each level, in points. */
const INDENT = 20;

/** Every row of the tree, depth first, in the order the rows are listed. */
const rowsOf = (nodes: readonly TreeViewNode[]): TreeViewNode[] =>
  nodes.flatMap((node) => [node, ...rowsOf(node.children ?? [])]);

/** The rows with the children loaded so far put under their rows. */
const withLoaded = (
  nodes: readonly TreeViewNode[],
  loaded: Readonly<Record<string, readonly TreeViewNode[]>>,
): readonly TreeViewNode[] =>
  nodes.map((node) => {
    const children = node.children ?? loaded[node.id];
    return children ? { ...node, children: withLoaded(children, loaded) } : node;
  });

/** A multiple tree's checkbox: a box with a tick when checked, a dash when partly checked. */
function CheckMark({ state }: { readonly state: "on" | "off" | "some" }): ReactElement {
  return (
    <View
      className={`size-5 items-center justify-center rounded-[var(--radius-control)] border ${state === "off" ? "border-separator bg-background" : "border-accent bg-accent-soft"}`}
    >
      {state === "off" ? null : (
        <Icon name={state === "on" ? "check" : "minus"} size="sm" tone="accent" />
      )}
    </View>
  );
}

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
  // The Icon already points it left in right-to-left, so it turns the other way to point down.
  const angle = isExpanded ? (direction === "rtl" ? -90 : 90) : 0;
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
  isSelectionPropagated = false,
  onLoadChildren,
  onMove: _onMove,
  ...rest
}: TreeViewProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion();
  const [loaded, setLoaded] = useState<Readonly<Record<string, readonly TreeViewNode[]>>>({});
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const tree = withLoaded(items, loaded);
  const rows = rowsOf(tree);
  const order = rows.map((row) => row.id);
  const [selected, setSelected] = useKeys(selectedKeys, defaultSelectedKeys, onSelectionChange);
  const [expanded, setExpanded] = useKeys(expandedKeys, defaultExpandedKeys, onExpandedChange);
  const inOrder = (keys: ReadonlySet<string>) => order.filter((id) => keys.has(id));
  const isPropagated = isSelectionPropagated && selectionMode === "multiple";
  const checked = new Set(selected);

  // An expanded row whose children are not loaded yet loads them, once at a time.
  useEffect(() => {
    if (!onLoadChildren) return;
    for (const id of expanded) {
      const node = rows.find((row) => row.id === id);
      if (!node?.hasChildren || node.children || loading.has(id)) continue;
      setLoading((now) => new Set(now).add(id));
      const done = () =>
        setLoading((now) => {
          const next = new Set(now);
          next.delete(id);
          return next;
        });
      onLoadChildren(id).then(
        (children) => {
          setLoaded((now) => ({ ...now, [id]: children }));
          done();
          // A checked parent checks the rows it just loaded, so it stays checked.
          if (isPropagated && selected.includes(id)) {
            setSelected([...selected, ...rowsOf(children).map((row) => row.id)]);
          }
        },
        () => {
          done();
          setExpanded(expanded.filter((key) => key !== id));
        },
      );
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: loads follow the expanded set only; the tree and the loading set change as a result
  }, [expanded, onLoadChildren]);

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
        : isPropagated
          ? propagateTreeSelection(tree, selected, toggle(selected, node.id))
          : toggle(selected, node.id),
    );
  };

  const renderNode = (node: TreeViewNode, level: number, index: number): ReactElement => {
    const hasChildren =
      (node.children?.length ?? 0) > 0 || (node.hasChildren === true && !node.children);
    const isExpanded = expanded.includes(node.id);
    const isSelected = selected.includes(node.id);
    const check = isPropagated ? treeCheckStateOf(node, checked) : isSelected ? "on" : "off";
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
                  ? { checked: check === "some" ? "mixed" : check === "on" }
                  : { selected: isSelected }),
            }}
            disabled={node.isDisabled ?? false}
            className={`min-h-11 flex-1 flex-row items-center gap-2 ${node.isDisabled ? "opacity-50" : ""}`}
            onPress={() => press(node)}
          >
            {selectionMode === "multiple" ? <CheckMark state={check} /> : null}
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
        {isExpanded && loading.has(node.id) ? (
          <View
            accessibilityLiveRegion="polite"
            className="min-h-11 flex-row items-center gap-2"
            style={{ paddingStart: level * INDENT + 8 + 36 }}
          >
            <Spinner size="sm" />
            <Text tone="muted">{t(UI_KEYS.ui.tree_view.loading)}</Text>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <View {...rest} accessibilityLabel={label}>
      {tree.map((node, index) => renderNode(node, 1, index))}
    </View>
  );
}
