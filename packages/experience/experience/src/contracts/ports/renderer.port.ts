/**
 * Stackra file contract:
 * Purpose: the `Renderer` port: turns an L2 document into the target's output (React elements on the web, React
 *          Native elements on a phone), each node resolved to the block registered for its key on that target.
 * Boundary: an abstract class that is its own token, keyed `experience.Renderer`; the drivers are `react` (`./react`)
 *           and `native` (`./native`), and the generated wiring binds the one of the target. Its output is `unknown`
 *           here because the leaf entry names no runtime; each driver narrows it. A document naming a block nobody
 *           registered, or props its block refuses, throws a refusal (`unknown_block`, `invalid_document`) before
 *           anything is drawn (ADR 0110 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 6); ADR 0112 (decisions X5 and X9); ADR 0294 (decisions 15, 16 and 17); ADR
 *                     0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { RenderContext } from "#contracts/types/render-context.type";

/**
 * Renders documents for one target.
 *
 * @example
 * const element = container.get(Renderer).render(page.root, { locale, onNavigate });
 */
export abstract class Renderer extends Port {
  /** Type-only port key, so `DriverName<Renderer>` narrows to this port's drivers. */
  declare readonly "~key": "experience.Renderer";

  /**
   * The target's output for `document`: one node or a list of nodes, or `null` and `undefined` for nothing.
   *
   * @throws UnknownBlockError when a node names a block no one registered on this target.
   * @throws InvalidDocumentError when the document is not a node tree or a node's props break its block's schema.
   */
  abstract render(document: unknown, context: RenderContext): unknown;
}
