/**
 * Stackra file contract:
 * Purpose: the web `TreeView` on React Aria's `Tree`: nested rows (a chart of accounts, categories, an org chart, a
 *          bill of materials) that expand and collapse, with none, one or several selected. Arrow keys move and open
 *          rows, Enter activates one (`onAction`), and a multiple tree draws a checkbox per row. The chevron turns a
 *          quarter towards the children, mirrored in a right-to-left layout, and the children of a row fade and
 *          stagger in when it opens.
 * Boundary: React Aria owns the keyboard, focus and ARIA tree roles; this draws the rows with theme classes. The
 *           selection and the expanded set are reported in the order the rows are listed. The stagger is `motion`'s
 *           and the chevron's a CSS transition; both stop under prefers-reduced-motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (React Aria on web); ADR 0329 (motion
 *          layer); design-system gap inventory (2026-10-28) row 22; WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
import { Checkbox as HeroCheckbox, cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import {
  Button as AriaButton,
  Tree,
  TreeItem,
  TreeItemContent,
  useLocale,
  type Selection,
} from "react-aria-components";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Icon } from "#react/icon/icon";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { TreeViewProps } from "#react/tree-view/tree-view.props";

/** The delay between two children fading in, in seconds. */
const STAGGER_SECONDS = 0.03;

/** Every id of the tree, depth first, in the order the rows are listed. */
const idsOf = (nodes: readonly TreeViewNode[]): string[] =>
  nodes.flatMap((node) => [node.id, ...idsOf(node.children ?? [])]);

/** React Aria's key set as ids in list order; `all` is every id. */
const keysOf = (selection: Selection, order: readonly string[]): readonly string[] =>
  selection === "all" ? order : order.filter((id) => selection.has(id));

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
  className,
  ...rest
}: TreeViewProps): ReactElement {
  const { direction } = useLocale();
  const isReduced = useReducedMotion() ?? false;
  const order = idsOf(items);

  const renderNode = (node: TreeViewNode, index: number): ReactElement => (
    <TreeItem
      key={node.id}
      id={node.id}
      textValue={node.label}
      {...omitUndefined({ isDisabled: node.isDisabled })}
      className={
        cn(
          "group cursor-default text-foreground outline-none",
          "data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus",
          "data-[hovered]:bg-default data-[selected]:bg-accent-soft data-[disabled]:opacity-50",
        ) ?? ""
      }
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded, level, selectionMode: mode }) => (
          <motion.div
            // The top level draws at once; a child fades in after its earlier siblings.
            initial={isReduced || level === 1 ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * STAGGER_SECONDS }}
            className="flex min-h-10 items-center gap-2 py-1.5 pe-3"
            style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.5}rem` }}
          >
            {mode === "multiple" ? (
              <HeroCheckbox slot="selection">
                <HeroCheckbox.Control>
                  <HeroCheckbox.Indicator />
                </HeroCheckbox.Control>
              </HeroCheckbox>
            ) : null}
            {hasChildItems ? (
              <AriaButton slot="chevron" className="inline-flex size-6 items-center justify-center">
                <span
                  className="inline-flex transition-[rotate] duration-200 motion-reduce:transition-none"
                  // A right chevron turns down to open; in right-to-left it starts pointing left.
                  style={{ rotate: `${isExpanded ? 90 : direction === "rtl" ? 180 : 0}deg` }}
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
    </TreeItem>
  );

  return (
    <Tree
      {...rest}
      aria-label={label}
      selectionMode={selectionMode}
      className={cn("flex flex-col outline-none", className) ?? ""}
      {...omitUndefined({
        selectedKeys,
        defaultSelectedKeys,
        expandedKeys,
        defaultExpandedKeys,
        onAction: onAction && ((key: string | number) => onAction(String(key))),
        onSelectionChange:
          onSelectionChange && ((keys: Selection) => onSelectionChange(keysOf(keys, order))),
        onExpandedChange:
          onExpandedChange &&
          ((keys: Set<string | number>) => onExpandedChange(keysOf(keys, order))),
      })}
    >
      {items.map(renderNode)}
    </Tree>
  );
}
