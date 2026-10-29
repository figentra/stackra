/**
 * Stackra file contract:
 * Purpose: `SpotlightOptions`, the shape of `SpotlightConfig`: the visibility rules of the phone's search, that is
 *          whether it is fed at all, the record kinds a product opts in, and how many and how recent the records are.
 * Boundary: a shape class; it registers this package's own schema (`SPOTLIGHT_CONFIG_SCHEMA`) when the module loads.
 *           No kind is indexed until a product lists it, so a new record type never reaches the phone's search by
 *           default. Ownership and the sensitive flag are fixed rules of `indexableItems`, not options.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0333 (decision 7: no default visibility).
 */
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import { SPOTLIGHT_CONFIG_SCHEMA } from "#core/constants/spotlight-config-schema.constant";

/** The phone's search rules. */
export class SpotlightOptions extends Schema {
  /** The record kinds (`crm.customer`) that may be indexed; empty indexes nothing. */
  // reason: a string list; the package's own shipped schema says it
  @Field(SPOTLIGHT_CONFIG_SCHEMA.shape.kinds)
  kinds: string[] = [];

  /** The most records indexed, newest first. */
  @Int({
    min: 0,
    max: 500,
  })
  maxItems = 50;

  /** Records unchanged for longer than this many days are left out. */
  @Int({
    min: 1,
    max: 365,
  })
  maxAgeDays = 30;

  /** Feed the phone's search at all; off clears nothing by itself, the indexer's next sync does. */
  isEnabled = true;
}

registerSchemas([[SpotlightOptions, SPOTLIGHT_CONFIG_SCHEMA]]);
