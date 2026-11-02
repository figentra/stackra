/**
 * Stackra file contract:
 * Purpose: `uiMenusOf(ir)`, a package's `ui.menus`: each `Menu({...})` class its `react` or `native` entry declares,
 *          with its key (`<module>_<stem>`), module, class, entry and `MenuKind`, so a host app registers it for a
 *          shell's `useMenus` without naming the class.
 * Boundary: pure. Only a package records them, and only from its UI entries (ADR 0111 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decisions 1, 3 and 4); STA-1947.
 */
import { snakeCase } from "@stackra/support";

import { entryOf } from "#core/functions/entry-of.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** One recorded package menu. */
type MenuEntry = {
  key: string;
  module: string;
  class: string;
  entry: "react" | "native";
  kind?: string;
};

/**
 * The menus a package's UI entries ship, sorted by key.
 *
 * @example
 * uiMenusOf(loyaltyKitIr)[0]; // { key: "loyalty_kit_main", module: "loyalty_kit", class: "MainMenu", entry: "react", kind: "navigation" }
 */
export function uiMenusOf(ir: MemberIR): MenuEntry[] {
  if (ir.layout !== "package") return [];
  return (
    ir.classes
      .flatMap((declared): MenuEntry[] => {
        const entry = entryOf(declared.file);
        if (declared.kind !== "menu" || (entry !== "react" && entry !== "native")) return [];
        const stem = (declared.file.split("/").pop() ?? "").replace(/\.menu\.tsx?$/, "");
        const kind = declared.options["kind"];
        return [
          {
            key: `${declared.module}_${snakeCase(stem)}`,
            module: declared.module,
            class: declared.name,
            entry,
            ...(typeof kind === "string" ? { kind } : {}),
          },
        ];
      })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => (`${a.key} ${a.entry}` < `${b.key} ${b.entry}` ? -1 : 1))
  );
}
