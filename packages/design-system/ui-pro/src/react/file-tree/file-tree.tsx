/**
 * Stackra file contract:
 * Purpose: the web `FileTree` compound on HeroUI Pro's FileTree: the tree root, which maps the contract's `label`
 *          to `aria-label` and `isMotionReduced` to `reduceMotion` and takes the shared `size`, and the parts Item,
 *          Indicator, Section and Header; the hooks `useFileTree` and `useFileTreeDrag` are re-exported.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. Selection, expansion,
 *          `onAction` and the item's `onPress` and `isDisabled` are React Aria's, passed through. The compound
 *          exposes the documented parts: HeroUI Pro's `FileTree.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { FileTree as HeroFileTree } from "@heroui-pro/react/file-tree";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { FileTreeProps } from "#react/file-tree/file-tree.props";

/** The tree root: HeroUI Pro's, named by `label`. */
function FileTreeRoot<T extends object>({
  label,
  isMotionReduced,
  size,
  ...rest
}: FileTreeProps<T>) {
  return (
    <HeroFileTree.Root<T>
      {...rest}
      {...omitUndefined({ reduceMotion: isMotionReduced, size })}
      aria-label={label}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface FileTreeParts {
  /** A file or folder row; nest items as children for a folder. */
  readonly Item: typeof HeroFileTree.Item;
  /** The expand chevron, replaceable inside an item. */
  readonly Indicator: typeof HeroFileTree.Indicator;
  /** A titled group of items. */
  readonly Section: typeof HeroFileTree.Section;
  /** The heading of a section. */
  readonly Header: typeof HeroFileTree.Header;
}

/** A tree of files and folders: `FileTree.Item` rows, optionally grouped in `FileTree.Section`. */
export const FileTree: typeof FileTreeRoot & FileTreeParts = Object.assign(FileTreeRoot, {
  Item: HeroFileTree.Item,
  Indicator: HeroFileTree.Indicator,
  Section: HeroFileTree.Section,
  Header: HeroFileTree.Header,
});

export { useFileTree, useFileTreeDrag } from "@heroui-pro/react/file-tree";
