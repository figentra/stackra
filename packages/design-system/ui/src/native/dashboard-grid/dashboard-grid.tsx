/**
 * Stackra file contract:
 * Purpose: the native `DashboardGrid`: a dashboard's tiles in one full-width column. In edit mode the tiles fold to
 *          their names in a `SortableList`, reordered by dragging the grip or by VoiceOver and TalkBack's "Move up" and
 *          "Move down" actions, the new position announced. The layout is the caller's, or kept through a
 *          `DashboardLayoutPort`, the same as on the web.
 * Boundary: a phone has one column, so a tile's `size` is kept for the web and not drawn (WidgetFrame fills the width on
 *           native). Tiles fold while editing because `SortableList` needs rows of one height. Motion and haptics are
 *           `SortableList`'s, still under Reduce Motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decisions 16 and 18); WCAG 2.2
 *          SC 2.5.7; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import { useDashboardLayout } from "#react/hooks/use-dashboard-layout";
import type { DashboardGridProps } from "#native/dashboard-grid/dashboard-grid.props";
import { SortableList } from "#native/sortable-list/sortable-list";

/** The default for an unset layout: one stable empty list. */
const NONE: DashboardLayout = [];

/** A column of dashboard tiles the reader can reorder. */
export function DashboardGrid({
  label,
  renderTile,
  tileLabel,
  layout,
  defaultLayout = NONE,
  onLayoutChange,
  layoutPort,
  isEditing = false,
  className,
}: DashboardGridProps): ReactElement {
  const [own, setOwn] = useDashboardLayout(layoutPort, defaultLayout);
  const tiles = layout ?? own;
  const change = (next: DashboardLayout) => {
    if (layout === undefined) setOwn(next);
    onLayoutChange?.(next);
  };
  if (isEditing)
    return (
      <SortableList
        label={label}
        items={tiles.map((tile) => ({ ...tile, label: tileLabel(tile.id) }))}
        onReorder={(rows) => change(rows.map(({ id, size }) => ({ id, size })))}
        {...(className ? { className } : {})}
      />
    );
  return (
    <View accessibilityLabel={label} className={["gap-4", className].filter(Boolean).join(" ")}>
      {tiles.map((tile) => (
        <View key={tile.id}>{renderTile(tile.id)}</View>
      ))}
    </View>
  );
}
