/**
 * Stackra file contract:
 * Purpose: the web `WorkflowCanvas`: an automation as a graph, its trigger and steps as boxes in columns left to right
 *          in flow order, the arrows between them drawn with each branch's condition, and on a run each box tinted by
 *          where its step stands.
 * Boundary: shows and selects, never edits: pressing a node calls `onSelect`, and the caller opens the step's form.
 *           Keyboard: the nodes are one tab stop; arrows right and left go to the next or previous node along an
 *           arrow (mirrored in RTL), up and down to the node above or below in the column. Each node reads its status
 *           and where it leads in words, so neither colour nor the drawing carries meaning alone. HeroUI Pro has no
 *           graph canvas, so this is the package's own markup; the page scrolls a graph wider than its box.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); OS-230 (graph canvas); WCAG 2.2 SC 1.4.1 and 2.1.1.
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { PlanStepStatus } from "#contracts/enums/plan-step-status.enum";

import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { workflowLayout } from "#core/functions/workflow-layout.function";
import { useUiProText } from "#react/hooks/use-ui-pro-text";
import type { WorkflowCanvasProps } from "#react/workflow-canvas/workflow-canvas.props";

/** A node box and the gaps between boxes, in CSS pixels. */
const NODE_WIDTH = 200;
const NODE_HEIGHT = 64;
const GAP_X = 72;
const GAP_Y = 24;

/** The border of a node by its run status. */
const BORDER: Readonly<Record<PlanStepStatus, string>> = Object.freeze({
  pending: "border-border",
  running: "border-accent",
  done: "border-success",
  failed: "border-danger",
  skipped: "border-border border-dashed opacity-70",
});

/** An automation as a graph of its trigger and steps. */
export function WorkflowCanvas({
  label,
  nodes,
  edges,
  selectedId,
  onSelect,
  actions,
  statusLabels,
}: WorkflowCanvasProps): ReactElement {
  const t = useUiProText();
  const markerId = useId();
  const { direction } = useLocale();
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const { placements, layers, rows } = workflowLayout(nodes, edges);
  const shown = edges.filter(
    (edge) => edge.from !== edge.to && placements.has(edge.from) && placements.has(edge.to),
  );
  const titleOf = new Map(nodes.map((node) => [node.id, node.title]));
  const width = Math.max(0, layers * (NODE_WIDTH + GAP_X) - GAP_X);
  const height = Math.max(0, rows * (NODE_HEIGHT + GAP_Y) - GAP_Y);

  const at = (id: string): { x: number; y: number } => {
    const place = placements.get(id) ?? { layer: 0, row: 0 };
    const column = direction === "rtl" ? layers - 1 - place.layer : place.layer;
    return { x: column * (NODE_WIDTH + GAP_X), y: place.row * (NODE_HEIGHT + GAP_Y) };
  };
  const statusOf = (status: PlanStepStatus): string =>
    statusLabels?.[status] ?? t(UI_PRO_KEYS.ui_pro.enums.plan_step_status[status]);
  const leadsTo = (id: string): string => {
    const next = shown
      .filter((edge) => edge.from === id)
      .map((edge) => {
        const title = titleOf.get(edge.to) ?? edge.to;
        return edge.label === undefined ? title : `${title} (${edge.label})`;
      });
    return next.length === 0
      ? ""
      : `. ${t(UI_PRO_KEYS.ui_pro.workflow_canvas.leads_to, { steps: next.join(", ") })}`;
  };

  // The roving tab stop: the focused node, else the selected one, else the first.
  const stop = [focusedId, selectedId, nodes[0]?.id].find(
    (id) => id !== undefined && placements.has(id),
  );
  const move = (id: string, key: KeyboardEvent<HTMLButtonElement>): void => {
    const place = placements.get(id);
    if (place === undefined) return;
    const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    const byRow = (ids: readonly string[]): string | undefined =>
      [...ids].sort((a, b) => (placements.get(a)?.row ?? 0) - (placements.get(b)?.row ?? 0))[0];
    let target: string | undefined;
    if (key.key === forward) target = byRow(shown.filter((e) => e.from === id).map((e) => e.to));
    else if (key.key === back) target = byRow(shown.filter((e) => e.to === id).map((e) => e.from));
    else if (key.key === "ArrowUp" || key.key === "ArrowDown") {
      const row = place.row + (key.key === "ArrowUp" ? -1 : 1);
      target = nodes.find((node) => {
        const other = placements.get(node.id);
        return other?.layer === place.layer && other.row === row;
      })?.id;
    } else return;
    key.preventDefault();
    if (target === undefined) return;
    setFocusedId(target);
    buttons.current.get(target)?.focus();
  };

  return (
    <div data-slot="workflow-canvas" className="flex flex-col gap-3">
      <div className="overflow-auto">
        <div role="group" aria-label={label} className="relative" style={{ width, height }}>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-visible text-muted"
            width={width}
            height={height}
          >
            <defs>
              <marker
                id={markerId}
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {shown.map((edge) => {
              const from = at(edge.from);
              const to = at(edge.to);
              const ahead = to.x >= from.x;
              const x1 = from.x + (ahead ? NODE_WIDTH : 0);
              const x2 = to.x + (ahead ? 0 : NODE_WIDTH);
              const y1 = from.y + NODE_HEIGHT / 2;
              const y2 = to.y + NODE_HEIGHT / 2;
              const mid = (x1 + x2) / 2;
              return (
                <g key={`${edge.from}->${edge.to}`} data-edge={`${edge.from}->${edge.to}`}>
                  <path
                    d={`M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    markerEnd={`url(#${markerId})`}
                  />
                  {edge.label === undefined ? null : (
                    <text
                      x={mid}
                      y={(y1 + y2) / 2 - 6}
                      textAnchor="middle"
                      className="fill-foreground stroke-background text-xs"
                      paintOrder="stroke"
                      strokeWidth="4"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {nodes.map((node) => {
            if (!placements.has(node.id)) return null;
            const { x, y } = at(node.id);
            const isSelected = node.id === selectedId;
            return (
              <button
                key={node.id}
                ref={(element) => {
                  if (element === null) buttons.current.delete(node.id);
                  else buttons.current.set(node.id, element);
                }}
                type="button"
                data-node={node.id}
                data-status={node.status}
                aria-pressed={onSelect === undefined ? undefined : isSelected}
                tabIndex={node.id === stop ? 0 : -1}
                onFocus={() => setFocusedId(node.id)}
                onClick={() => onSelect?.(node.id)}
                onKeyDown={(key) => move(node.id, key)}
                className={`absolute flex flex-col items-start justify-center overflow-hidden rounded-xl border-2 bg-surface px-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  BORDER[node.status ?? "pending"]
                } ${isSelected ? "ring-2 ring-accent" : ""}`}
                style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT }}
              >
                <span className="w-full truncate text-sm font-medium">{node.title}</span>
                {node.detail == null ? null : (
                  <span className="w-full truncate text-xs text-muted">{node.detail}</span>
                )}
                <span className="sr-only">
                  {node.status === undefined ? "" : ` (${statusOf(node.status)})`}
                  {leadsTo(node.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {actions == null ? null : <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
