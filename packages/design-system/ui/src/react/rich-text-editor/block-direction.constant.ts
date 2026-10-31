/**
 * Stackra file contract:
 * Purpose: `BLOCK_DIRECTION`, the TipTap extension that gives each wrapper block (list, list item, quote) the direction
 *          of its own first letter. `dir="auto"` on a wrapper looks past every child that sets `dir`, and TipTap sets it
 *          on all of them, so an Arabic list would otherwise lay out left to right with its numbers on the wrong side.
 * Boundary: view decorations only; the stored document keeps `dir: "auto"` (ADR 0466 decision 8).
 * Runtime: browser
 * Governing contract: ADR 0466 (decision 8); ADR 0060 (right-to-left); STA-1371.
 */
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { textDirectionOf } from "#core/functions/text-direction-of.function";

/** Sets `dir` on every non-text block from its text. */
export const BLOCK_DIRECTION = Extension.create({
  name: "blockDirection",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const found: Decoration[] = [];
            state.doc.descendants((node, position) => {
              if (node.isTextblock || node.isLeaf) return false;
              const dir = textDirectionOf(node.textContent);
              if (dir) found.push(Decoration.node(position, position + node.nodeSize, { dir }));
              return true;
            });
            return DecorationSet.create(state.doc, found);
          },
        },
      }),
    ];
  },
});
