/**
 * Stackra file contract:
 * Purpose: `Pass({ key })`, the kind base of a wallet pass kind a module declares in its `integrations/` group: its
 *          `content(record)` turns the owning record into `PassContent`, which the Apple Wallet and Google Wallet
 *          drivers render and sign.
 * Boundary: called only (a key is required). A binding: dependencies are constructor parameters. The pass updates when
 *           its source record changes, through the module's integration events; the pass web service endpoints are
 *           the module's `WebhookEvent<I>` classes and queries (ADR 0348 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0305 (rule 2: a kind with options is called); ADR 0294 (decision 25).
 */
import { createKind } from "@stackra/container";

import type { PassContent } from "#core/types/pass-content.type";
import type { PassOptions } from "#core/types/pass-options.type";

/** The instance side every pass kind shares. */
export abstract class PassBase {
  /** Type-only kind brand. */
  declare readonly "~kind": "pass";

  /** The pass for one owning record; the subclass types `record`. */
  abstract content(record: never): PassContent | Promise<PassContent>;
}

/** Checks the options of a pass kind. */
function read(options: PassOptions) {
  if (typeof options?.key !== "string" || !/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(options.key))
    throw new TypeError(
      `Pass({ key }) needs a snake_case key, got ${JSON.stringify(options?.key)}`,
    );
  return { key: options.key };
}

/**
 * The pass kind base.
 *
 * @example
 * export class LoyaltyCardPass extends Pass({ key: "loyalty_card" }) {
 *   content(card: LoyaltyCard): PassContent {
 *     return { serial: card.id, title: card.programName, fields: [{ label, value: String(card.points) }] };
 *   }
 * }
 */
export const Pass = createKind("pass", PassBase, read) as (
  options: PassOptions,
) => abstract new () => PassBase;
