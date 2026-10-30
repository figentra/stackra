/**
 * Stackra file contract:
 * Purpose: the web `TreeView` on React Aria's `Tree`: nested rows (a chart of accounts, categories, an org chart, a
 *          bill of materials) that expand and collapse, with none, one or several selected. Arrow keys move and open
 *          rows, Enter activates one (`onAction`), and a multiple tree draws a checkbox per row; with
 *          `isSelectionPropagated` a check carries down to every row under it and a partly checked parent shows a
 *          dash. A row marked `hasChildren` loads its rows through `onLoadChildren` the first time it opens, with a
 *          spinner row meanwhile. With `onMove`, rows carry a drag handle and can be dragged (or moved from the
 *          keyboard) before, after or into another row. The chevron turns a quarter towards the children, mirrored in
 *          a right-to-left layout, and the children of a row fade and stagger in when it opens.
 * Boundary: React Aria owns the keyboard, focus, drag and drop and ARIA tree roles; this draws the rows with theme
 *           classes. The selection and the expanded set are reported in the order the rows are listed. Loaded rows are
 *           kept in the tree's state; moved rows are the app's to apply (`moveTreeNodes`). The stagger is `motion`'s
 *           and the chevron's a CSS transition; both stop under prefers-reduced-motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (React Aria on web); ADR 0329 (motion
 *          layer); design-system gap inventory (2026-10-28) row 22; STA-1371 (wave C); WCAG 2.2 SC 1.3.1, 2.1.1,
 *          2.5.7, 4.1.2.
 */
import { Checkbox as HeroCheckbox, cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactElement } from "react";
import {
  Button as AriaButton,
  DropIndicator,
  Tree,
  TreeItem,
  TreeItemContent,
  TreeLoadMoreItem,
  useDragAndDrop,
  useLocale,
  type Selection,
} from "react-aria-components";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { propagateTreeSelection } from "#core/functions/propagate-tree-selection.function";
import { treeCheckStateOf } from "#core/functions/tree-check-state-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import { Spinner } from "#react/spinner/spinner";
import type { TreeViewProps } from "#react/tree-view/tree-view.props";

/** The delay between two children fading in, in seconds. */
const STAGGER_SECONDS = 0.03;

/** Nothing selected or expanded yet. */
const NONE: readonly string[] = [];

/** Every row of the tree, depth first, in the order the rows are listed. */
const rowsOf = (nodes: readonly TreeViewNode[]): TreeViewNode[] =>
  nodes.flatMap((node) => [node, ...rowsOf(node.children ?? [])]);

/** React Aria's key set as ids in list order; `all` is every id. */
const keysOf = (selection: Selection, order: readonly string[]): readonly string[] =>
  selection === "all" ? order : order.filter((id) => selection.has(id));

/** The rows with the children loaded so far put under their rows. */
const withLoaded = (
  nodes: readonly TreeViewNode[],
  loaded: Readonly<Record<string, readonly TreeViewNode[]>>,
): readonly TreeViewNode[] =>
  nodes.map((node) => {
    const children = node.children ?? loaded[node.id];
    return children ? { ...node, children: withLoaded(children, loaded) } : node;
  });

/** Nested rows that expand and collapse, with optional selection, lazy children and dragging. */
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
  onMove,
  className,
  ...rest
}: TreeViewProps): ReactElement {
  const t = useUiText();
  const { direction } = useLocale();
  const isReduced = useReducedMotion() ?? false;
  const [loaded, setLoaded] = useState<Readonly<Record<string, readonly TreeViewNode[]>>>({});
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const [ownExpanded, setOwnExpanded] = useState(defaultExpandedKeys ?? NONE);
  const [ownSelected, setOwnSelected] = useState(defaultSelectedKeys ?? NONE);
  const tree = withLoaded(items, loaded);
  const rows = rowsOf(tree);
  const order = rows.map((row) => row.id);
  const expanded = expandedKeys ?? ownExpanded;
  const selected = selectedKeys ?? ownSelected;
  const isPropagated = isSelectionPropagated && selectionMode === "multiple";

  const setExpanded = (keys: readonly string[]) => {
    if (expandedKeys === undefined) setOwnExpanded(keys);
    onExpandedChange?.(keys);
  };
  const setSelected = (keys: readonly string[]) => {
    if (selectedKeys === undefined) setOwnSelected(keys);
    onSelectionChange?.(keys);
  };

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

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => ({
        "text/plain": rows.find((row) => row.id === key)?.label ?? String(key),
      })),
    onMove: (event) =>
      onMove?.([...event.keys].map(String), {
        id: String(event.target.key),
        position: event.target.dropPosition === "on" ? "inside" : event.target.dropPosition,
      }),
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className="h-0.5 rounded-[var(--radius-pill)] outline-none data-[drop-target]:bg-accent"
      />
    ),
  });

  const checked = new Set(selected);

  const renderNode = (node: TreeViewNode, index: number): ReactElement => (
    <TreeItem
      key={node.id}
      id={node.id}
      textValue={node.label}
      {...omitUndefined({
        isDisabled: node.isDisabled,
        hasChildItems: node.hasChildren && !node.children ? true : undefined,
      })}
      className={
        cn(
          "group cursor-default text-foreground outline-none",
          "data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus",
          "data-[hovered]:bg-default data-[selected]:bg-accent-soft data-[disabled]:opacity-50",
          "data-[drop-target]:bg-accent-soft data-[drop-target]:outline-2 data-[drop-target]:outline-accent",
          "data-[dragging]:opacity-50",
        ) ?? ""
      }
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded, level, selectionMode: mode, allowsDragging }) => (
          <motion.div
            // The top level draws at once; a child fades in after its earlier siblings.
            initial={isReduced || level === 1 ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * STAGGER_SECONDS }}
            className="flex min-h-10 items-center gap-2 py-1.5 pe-3"
            style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.5}rem` }}
          >
            {allowsDragging ? (
              <AriaButton
                slot="drag"
                className="inline-flex size-6 cursor-grab items-center justify-center text-muted outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus"
              >
                <Icon name="grip-vertical" size="sm" />
              </AriaButton>
            ) : null}
            {mode === "multiple" ? (
              <HeroCheckbox
                slot="selection"
                {...(isPropagated
                  ? { isIndeterminate: treeCheckStateOf(node, checked) === "some" }
                  : {})}
              >
                <HeroCheckbox.Control>
                  <HeroCheckbox.Indicator />
                </HeroCheckbox.Control>
              </HeroCheckbox>
            ) : null}
            {hasChildItems ? (
              <AriaButton slot="chevron" className="inline-flex size-6 items-center justify-center">
                <span
                  className="inline-flex transition-[rotate] duration-200 motion-reduce:transition-none"
                  // The Icon already points it left in right-to-left, so it turns the other way to point down.
                  style={{ rotate: `${isExpanded ? (direction === "rtl" ? -90 : 90) : 0}deg` }}
                >
                  <Icon name="chevron-right" size="sm" />
                </span>
              </AriaButton>
            ) : (
              <span className="size-6 shrink-0" />
            )}
            <SlotIcon icon={node.icon} />
            <span className="min-w-0 flex-1 truncate">{node.label}</span>
            {node.description ? (
              <span className="shrink-0 text-sm text-muted">{node.description}</span>
            ) : null}
          </motion.div>
        )}
      </TreeItemContent>
      {node.children?.map(renderNode)}
      {loading.has(node.id) ? (
        <TreeLoadMoreItem isLoading className="flex min-h-10 items-center">
          {({ level }) => (
            <span
              className="flex items-center gap-2 text-sm text-muted"
              style={{ paddingInlineStart: `${(level - 1) * 1.25 + 2.25}rem` }}
            >
              <Spinner size="sm" />
              {t(UI_KEYS.ui.tree_view.loading)}
            </span>
          )}
        </TreeLoadMoreItem>
      ) : null}
    </TreeItem>
  );

  return (
    <Tree
      {...rest}
      aria-label={label}
      selectionMode={selectionMode}
      className={cn("flex flex-col outline-none", className) ?? ""}
      expandedKeys={expanded}
      onExpandedChange={(keys) => setExpanded(keysOf(keys, order))}
      selectedKeys={selected}
      onSelectionChange={(keys) => {
        const next = keysOf(keys, order);
        setSelected(isPropagated ? propagateTreeSelection(tree, selected, next) : next);
      }}
      {...omitUndefined({
        onAction: onAction && ((key: string | number) => onAction(String(key))),
        dragAndDropHooks: onMove ? dragAndDropHooks : undefined,
      })}
    >
      {tree.map(renderNode)}
    </Tree>
  );
}
