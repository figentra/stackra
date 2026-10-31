/**
 * Stackra file contract:
 * Purpose: the web `JsonViewer`: a JSON value as nested `details` whose objects and arrays fold, keys, strings,
 *          numbers, booleans and null in the theme's syntax colours (`--syntax-<role>`, 4.5:1 on the code background), and a count beside a folded branch.
 * Boundary: left to right in every page; native `details` gives keyboard and screen-reader folding for free.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement, ReactNode } from "react";

import type { JsonViewerProps } from "#react/code-block/json-viewer.props";

/** A leaf value in its tone. */
function Leaf({ value }: { readonly value: unknown }): ReactElement {
  if (typeof value === "string")
    return <span style={{ color: "var(--syntax-string)" }}>{JSON.stringify(value)}</span>;
  if (typeof value === "number")
    return <span style={{ color: "var(--syntax-number)" }}>{String(value)}</span>;
  if (typeof value === "boolean")
    return <span style={{ color: "var(--syntax-keyword)" }}>{String(value)}</span>;
  return <span style={{ color: "var(--syntax-keyword)" }}>{"null"}</span>;
}

/** One node: a branch that folds, or a leaf. */
function Node({
  name,
  value,
  depth,
  open,
}: {
  readonly name: ReactNode;
  readonly value: unknown;
  readonly depth: number;
  readonly open: number;
}): ReactElement {
  const key =
    name === null ? null : <span style={{ color: "var(--syntax-variable)" }}>{name}: </span>;
  if (value === null || typeof value !== "object")
    return (
      <div className="ps-4">
        {key}
        <Leaf value={value} />
      </div>
    );
  const isArray = Array.isArray(value);
  const entries = isArray
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);
  const [start, end] = isArray ? ["[", "]"] : ["{", "}"];
  return (
    <details open={depth < open} className="ps-4 [&[open]>summary>.count]:hidden">
      <summary className="cursor-pointer list-item rounded-[var(--radius-control-inner)] outline-none focus-visible:ring-2 focus-visible:ring-focus">
        {key}
        {start}
        <span className="count text-muted"> {entries.length} </span>
        <span className="count">{end}</span>
      </summary>
      {entries.map(([child, item]) => (
        <Node
          key={child}
          name={isArray ? null : child}
          value={item}
          depth={depth + 1}
          open={open}
        />
      ))}
      <div className="ps-4">{end}</div>
    </details>
  );
}

/** A foldable JSON tree. */
export function JsonViewer({
  value,
  label,
  defaultExpandDepth = 1,
  className,
}: JsonViewerProps): ReactElement {
  return (
    <div
      role="group"
      aria-label={label}
      dir="ltr"
      data-slot="json-viewer"
      className={cn(
        "overflow-x-auto rounded-[var(--radius-container)] border border-separator bg-surface-secondary p-3 text-start font-mono text-(length:--text-code) leading-6",
        className,
      )}
    >
      <Node name={null} value={value} depth={0} open={defaultExpandDepth} />
    </div>
  );
}
