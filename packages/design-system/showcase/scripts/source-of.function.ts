/**
 * Stackra file contract:
 * Purpose: `sourceOf`, who declares a prop, from the file of its first declaration.
 * Boundary: a pure function over a path.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { ApiProp } from "../src/types/api-prop.type.ts";

const HEROUI = /\/node_modules\/(@heroui|heroui-native)\//;
const REACT_ARIA =
  /\/node_modules\/(react-aria|react-aria-components|react-stately|@react-aria|@react-types|@react-stately)\//;

/** "stackra" inside `ownSrc`, "heroui" / "react-aria" by package; undefined = a platform base (DOM, ViewProps, lib). */
export function sourceOf(fileName: string, ownSrc: string): ApiProp["source"] | undefined {
  if (fileName.startsWith(ownSrc)) return "stackra";
  if (HEROUI.test(fileName)) return "heroui";
  if (REACT_ARIA.test(fileName)) return "react-aria";
  return undefined;
}
