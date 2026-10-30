/**
 * Stackra file contract:
 * Purpose: `sourceFiles`, the `.ts` and `.tsx` files under a folder, sorted, for discovery's text readers.
 * Boundary: reads the file tree only; skips `node_modules`, `dist`, dot folders (`.stackra`), declaration files and any
 *           folder named in `skip` (`__tests__`). Shared by `readI18nReferences` and `readAnchors`.
 * Runtime: node
 * Governing contract: ADR 0268 (R15); ADR 0490 (decision 1); STA-1298; STA-1631.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The source files under `folder`.
 *
 * @param folder - the folder to walk.
 * @param skip - folder names to leave out besides the tool folders.
 * @example
 * sourceFiles("apps/console", ["__tests__"]); // ["apps/console/src/main.ts", ...]
 */
export function sourceFiles(folder: string, skip: readonly string[] = []): string[] {
  return (
    readdirSync(folder, { withFileTypes: true })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))
      .flatMap((entry) => {
        if (entry.isDirectory())
          return entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === "dist" ||
            skip.includes(entry.name)
            ? []
            : sourceFiles(join(folder, entry.name), skip);
        return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")
          ? [join(folder, entry.name)]
          : [];
      })
  );
}
