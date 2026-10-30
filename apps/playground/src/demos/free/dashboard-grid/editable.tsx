/**
 * Stackra file contract:
 * Purpose: the "editable" demo of the web DashboardGrid: a sales dashboard of KPI and chart widgets; "Edit layout" shows
 *          each tile's drag handle, move and size controls, and the layout is kept in this browser.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The layout port is `localStorageLayoutPort`, so a reload keeps the reader's arrangement.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import {
  BarChart,
  DashboardGrid,
  Kpi,
  Switch,
  WidgetFrame,
  localStorageLayoutPort,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DASHBOARD_GRID_KEYS } from "#src/demos/free/dashboard-grid/dashboard-grid-keys.constant";

/** The demo's keys. */
const K = DASHBOARD_GRID_KEYS.dashboard_grid;

/** Where the layout is kept: this browser, under one key. */
const PORT = localStorageLayoutPort("playground.dashboard-grid.editable");

/** The tiles and their sizes before the reader changes anything. */
const DEFAULT_LAYOUT = [
  { id: "revenue", size: "small" },
  { id: "orders", size: "small" },
  { id: "customers", size: "small" },
  { id: "refunds", size: "small" },
  { id: "sales", size: "full" },
] as const;

/** A week of sales, Saturday first. */
const WEEK = [
  { day: "sat", sales: 42 },
  { day: "sun", sales: 38 },
  { day: "mon", sales: 51 },
  { day: "tue", sales: 47 },
  { day: "wed", sales: 56 },
  { day: "thu", sales: 63 },
  { day: "fri", sales: 71 },
] as const;

/** Dashboard grid: reorder and resize the widgets; the layout is saved. */
export default function Editable() {
  const t = useCatalogueText(MESSAGES.en);
  const [isEditing, setIsEditing] = useState(false);
  const tileLabel = (id: string) =>
    id === "sales" ? t(K.sales_by_day) : t(K[id as "revenue" | "orders" | "customers" | "refunds"]);
  // A KPI is its own tile (one surface, its label once); the chart sits in a WidgetFrame with its title.
  const renderTile = (id: string) =>
    id === "sales" ? (
      <WidgetFrame title={tileLabel(id)} description={t(K.range)} className="h-full">
        <BarChart
          data={WEEK.map((row) => ({ ...row, name: t(K[row.day]) }))}
          series={[{ key: "sales", label: t(K.sales) }]}
          xKey="name"
          height={180}
          label={t(K.sales_by_day)}
        />
      </WidgetFrame>
    ) : id === "revenue" ? (
      <Kpi
        className="h-full"
        icon="wallet"
        label={tileLabel(id)}
        value={184_200}
        trend={0.12}
        sparkline={[12, 15, 14, 18, 21, 24]}
      />
    ) : id === "orders" ? (
      <Kpi
        className="h-full"
        icon="shopping-cart"
        label={tileLabel(id)}
        value={1284}
        trend={0.06}
      />
    ) : id === "customers" ? (
      <Kpi className="h-full" icon="users" label={tileLabel(id)} value={312} trend={-0.04} />
    ) : (
      <Kpi
        className="h-full"
        icon="receipt"
        label={tileLabel(id)}
        value={14}
        trend={-0.2}
        better="down"
      />
    );
  return (
    <div className="grid w-full gap-4">
      <Switch label={t(K.edit)} value={isEditing} onChange={setIsEditing} />
      <DashboardGrid
        label={t(K.label)}
        defaultLayout={DEFAULT_LAYOUT}
        layoutPort={PORT}
        isEditing={isEditing}
        tileLabel={tileLabel}
        renderTile={renderTile}
      />
    </div>
  );
}
