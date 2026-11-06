/**
 * Stackra file contract:
 * Purpose: `hostRoutesOf(ir)`, the routes and menus an app composes from its dependencies' `ui.routes` and `ui.menus`
 *          (each with the entry, `react` or `native`, that serves its runtime), and `route_duplicate` or
 *          `menu_duplicate` for a key two owners record, or one that is also the app's own.
 * Boundary: pure; walks the manifests through `dependencyContributionsOf`, so the same entry reached twice is one. A manifest with
 *           no `ui` contributes nothing. The app's own route keys are `routeKey` and its own menu keys the snake_case
 *           stem, as its route table writes them.
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decisions 3 and 4); ADR 0053 (decision 2); STA-1947.
 */
import { snakeCase } from "@stackra/support";

import { dependencyContributionsOf } from "#core/functions/dependency-contributions-of.function";
import { routeKey } from "#core/functions/route-key.function";
import type { Contribution } from "#core/types/contribution.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A recorded route or menu, as a manifest holds it. */
type UiEntry = {
  readonly key: string;
  readonly module?: string;
  readonly class: string;
  readonly entry: string;
  readonly page?: string;
  readonly path?: string;
  readonly kind?: string;
};

/** The entries of `ui.<section>` in `manifest` that name a key, a class and a UI entry. */
function entriesIn(manifest: Readonly<Record<string, unknown>>, section: string): UiEntry[] {
  const ui = manifest["ui"];
  const list =
    typeof ui === "object" && ui !== null ? (ui as Record<string, unknown>)[section] : undefined;
  return Array.isArray(list)
    ? list.filter(
        (item): item is UiEntry =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as UiEntry).key === "string" &&
          typeof (item as UiEntry).class === "string" &&
          ((item as UiEntry).entry === "react" || (item as UiEntry).entry === "native"),
      )
    : [];
}

/**
 * The routes and menus `ir`'s dependencies ship, and the duplicates refused.
 *
 * @example
 * hostRoutesOf(appIr).routes.map(({ entry }) => entry.key); // ["loyalty_kit_points"]
 */
export function hostRoutesOf(ir: MemberIR): {
  readonly routes: readonly Contribution<UiEntry>[];
  readonly menus: readonly Contribution<UiEntry>[];
  readonly errors: readonly GenError[];
} {
  const same = (left: UiEntry, right: UiEntry): boolean =>
    left.class === right.class && left.module === right.module;
  // One key per runtime: a route a package ships in both entries is two contributions.
  const read = (section: string) => (manifest: Readonly<Record<string, unknown>>) =>
    entriesIn(manifest, section).map((entry): [string, UiEntry] => [
      `${entry.entry}:${entry.key}`,
      entry,
    ]);
  const routes = dependencyContributionsOf<UiEntry>(ir, read("routes"), same);
  const menus = dependencyContributionsOf<UiEntry>(ir, read("menus"), same);

  const own = (kind: string, key: (file: string) => string): Set<string> =>
    new Set(
      ir.classes.filter((declared) => declared.kind === kind).map((declared) => key(declared.file)),
    );
  const ownRoutes = own("route", routeKey);
  const ownMenus = own("menu", (file) =>
    snakeCase((file.split("/").pop() ?? "").replace(/\.menu\.tsx?$/, "")),
  );

  const errors: GenError[] = [];
  const refuse = (code: string, key: string, message: string): void => {
    errors.push({
      code,
      file: "package.json",
      line: 0,
      column: 0,
      subject: key,
      message,
      fix: "depend on only one of the two, or rename the route or menu file in its owner",
    });
  };
  for (const [code, found, mine] of [
    ["route_duplicate", routes, ownRoutes],
    ["menu_duplicate", menus, ownMenus],
  ] as const) {
    for (const { first, second } of found.duplicates)
      refuse(
        code,
        first.entry.key,
        `\`${first.entry.key}\` is shipped by ${first.entry.class} (${first.from}) and by ${second.entry.class} (${second.from})`,
      );
    for (const { entry, from } of found.entries)
      if (mine.has(entry.key))
        refuse(
          code,
          entry.key,
          `\`${entry.key}\` is both this app's own and ${entry.class}'s (${from})`,
        );
  }
  return { routes: routes.entries, menus: menus.entries, errors };
}
