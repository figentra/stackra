/**
 * Stackra file contract:
 * Purpose: `readAnchors`, discovery's read of the anchors of a member: every `anchor="<key>"` its components declare
 *          and every `anchor: "<key>"` its source refers to (a tour step, an answer), each with its place, so gen
 *          writes `ui.point` from the declared ones and refuses a reference to an undeclared one (`anchor_undeclared`,
 *          STA-1631).
 * Boundary: reads `.ts` and `.tsx` files under the member root, skipping `node_modules`, `dist`, dot folders
 *           (`.stackra`) and `__tests__`; writes nothing. Comment lines (`//`, ` * `) are skipped.
 *           shortcut: a text scan, not the syntax tree: a JSX attribute `anchor="..."` or `anchor={"..."}` declares, an
 *           object property `anchor: "..."` refers, and a key built from an expression is not seen. Read the `Tour`
 *           documents through the host when that kind lands (STA-1633).
 * Runtime: node
 * Governing contract: ADR 0490 (decisions 1 and 10); STA-1631.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import type { AnchorIR } from "#core/types/anchor-ir.type";

/** A JSX attribute `anchor="x"` or `anchor={"x"}`; the lookbehind keeps `data-anchor=` and `x.anchor=` out. */
const DECLARATION = /(?<![\w$.-])anchor=\{?\s*["']([^"']+)["']/g;

/** An object property `anchor: "x"`. */
const REFERENCE = /(?<![\w$.-])anchor\s*:\s*["']([^"']+)["']/g;

/** The `.ts`/`.tsx` files under `folder`, sorted, without tests and tool folders. */
function sourceFiles(folder: string): string[] {
  return (
    readdirSync(folder, { withFileTypes: true })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
      .flatMap((entry) => {
        if (entry.isDirectory())
          return entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === "dist" ||
            entry.name === "__tests__"
            ? []
            : sourceFiles(join(folder, entry.name));
        return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")
          ? [join(folder, entry.name)]
          : [];
      })
  );
}

/**
 * The anchors the member at `root` declares and refers to.
 *
 * @param root - the member root.
 * @example
 * readAnchors("apps/console").anchors[0]?.key; // "orders.export"
 */
export function readAnchors(root: string): {
  readonly anchors: readonly AnchorIR[];
  readonly references: readonly AnchorIR[];
} {
  const anchors: AnchorIR[] = [];
  const references: AnchorIR[] = [];
  for (const path of sourceFiles(root)) {
    const text = readFileSync(path, "utf8");
    if (!text.includes("anchor")) continue;
    text.split("\n").forEach((line, index) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      for (const [pattern, found] of [
        [DECLARATION, anchors],
        [REFERENCE, references],
      ] as const)
        for (const match of line.matchAll(pattern))
          found.push({
            file: relative(root, path),
            line: index + 1,
            column: (match.index ?? 0) + 1,
            key: match[1] ?? "",
          });
    });
  }
  return { anchors, references };
}
