/**
 * Stackra file contract:
 * Purpose: `uiRoutesOf(ir)`, a package's `ui.routes`: each `Route({...})` class its `react` or `native` entry declares,
 *          with its key (`<module>_<stem>`, snake_case so `registerRoutes` takes it), module, class, entry, path, the
 *          page beside it and, when it writes no `title`, the derived title key, so a host app lists it on that entry's runtime without a hand-written `register()`.
 * Boundary: pure. Only a package records them; a route elsewhere (an app's own, or a package's `node` or core entry) is
 *           not a UI contribution here. The page is the `.tsx` beside the route (`<stem>.native.tsx` first in the
 *           `native` entry), named by its export, which the entry barrel re-exports.
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decisions 1, 3 and 4); ADR 0053 (decision 2); ADR 0294 (decision 20); STA-1947.
 */
import { snakeCase } from "@stackra/support";

import { componentBeside } from "#core/functions/component-beside.function";
import { entryOf } from "#core/functions/entry-of.function";
import { routeTitleKey } from "#core/functions/route-title-key.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** One recorded package route. */
type RouteEntry = {
  key: string;
  module: string;
  class: string;
  entry: "react" | "native";
  path?: string;
  page?: string;
  title?: string;
};

/**
 * The routes a package's UI entries ship, sorted by key.
 *
 * @example
 * uiRoutesOf(loyaltyKitIr)[0]; // { key: "loyalty_kit_points", module: "loyalty_kit", class: "PointsRoute", entry: "react", path: "/points", page: "Points" }
 */
export function uiRoutesOf(ir: MemberIR): RouteEntry[] {
  if (ir.layout !== "package") return [];
  return (
    ir.classes
      .flatMap((declared): RouteEntry[] => {
        const entry = entryOf(declared.file);
        if (declared.kind !== "route" || (entry !== "react" && entry !== "native")) return [];
        const stem = (declared.file.split("/").pop() ?? "").replace(/\.route\.tsx?$/, "");
        const page =
          entry === "native"
            ? (componentBeside(ir, declared.file, stem, "native") ??
              componentBeside(ir, declared.file, stem, "browser"))
            : componentBeside(ir, declared.file, stem, "browser");
        const path = declared.options["path"];
        return [
          {
            key: `${declared.module}_${snakeCase(stem)}`,
            module: declared.module,
            class: declared.name,
            entry,
            ...(typeof path === "string" ? { path } : {}),
            ...(page === undefined ? {} : { page: page.name }),
            // A route that writes no title gets the derived key, so a menu never shows the raw route key (STA-2058).
            ...(declared.options["title"] === undefined
              ? { title: routeTitleKey(declared.module, declared.file) }
              : {}),
          },
        ];
      })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => (`${a.key} ${a.entry}` < `${b.key} ${b.entry}` ? -1 : 1))
  );
}
