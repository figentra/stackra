/**
 * Stackra file contract:
 * Purpose: `Layout`, the kind base of a layout: the frame around child routes (`class ShellLayout extends Layout({
 *          targets })`, or bare `extends Layout` with no options), in `routes/<name>/<name>.layout.ts` with its
 *          component beside it. Its `loader(ctx)` runs before any child's, so a session check or the site a request
 *          belongs to is resolved once; the data it returns is spread into each child's `RouteContext`.
 * Boundary: bare or called. `loader` is declared here (an author writes `override`); the base returns no data. Child
 *           routes name the layout with `layout: XLayout`; a layout never imports a route. The interface of the same
 *           name is its instance side.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 16 and 25); ADR 0305 (rules 2 and 3); ADR 0324 (an error below a layout
 *                     bubbles to the nearest boundary).
 */
import { createKind } from "@stackra/container";
import { Enum, Target } from "@stackra/contracts";

import type { LayoutClass } from "#core/types/layout-class.type";
import type { LayoutOptions } from "#core/types/layout-options.type";
import type { RouteContext } from "#core/types/route-context.type";

/** The instance side of every layout class. */
export interface Layout<O extends LayoutOptions = LayoutOptions> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a layout. */
  readonly "~kind": "layout";

  /** Type-only: the options the class was declared with. */
  readonly "~options": O;

  /** What every child shares; a redirect instead of data sends the visitor elsewhere before any child loads. */
  loader(ctx: RouteContext<this>): unknown;
}

/**
 * Checks `options`.
 *
 * @throws RangeError when a target is not a `Target` code or appears twice.
 */
function readLayoutOptions(options: LayoutOptions = {}): Readonly<Record<string, unknown>> {
  const targets = options.targets ?? null;
  if (targets !== null) {
    const known = Enum.values(Target);
    for (const target of targets)
      if (!known.includes(target)) throw new RangeError(`"${target}" is not a target`);
    if (new Set(targets).size !== targets.length)
      throw new RangeError("A layout names each target once");
  }
  return { targets: targets === null ? null : Object.freeze([...targets]) };
}

/**
 * The layout kind base.
 *
 * @example
 * export class ShellLayout extends Layout({ targets: [Target.Web, Target.Pwa, Target.Desktop] }) {
 *   override loader(ctx: RouteContext<this>) {
 *     if (!ctx.session) return ctx.redirect(Routes.sign_in, { search: { returnTo: ctx.path } });
 *     return null;
 *   }
 * }
 */
export const Layout = createKind(
  "layout",
  class LayoutBase {
    /** No data. */
    loader(): unknown {
      return null;
    }
  },
  readLayoutOptions,
) as LayoutClass & (<const O extends LayoutOptions>(options: O) => LayoutClass<O>);
