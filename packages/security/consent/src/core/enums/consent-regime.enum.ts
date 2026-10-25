/**
 * Stackra file contract:
 * Purpose: `ConsentRegime`, the rule a region's visitors get while they have not decided: opt-in (`gdpr`) or opt-out
 *          (`ccpa`). `ConsentConfig.regionDefaults` maps a region to one.
 * Boundary: an `Enum.of` value plus the type of the same name. A region with no regime, and no `default` entry, is
 *           treated as `gdpr`: decline by default. Global Privacy Control refuses under every regime.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 2 and 4); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/**
 * The pre-decision rule of a region.
 *
 * @example
 * override regionDefaults: Record<string, ConsentRegime> = { default: ConsentRegime.Gdpr, US: ConsentRegime.Ccpa };
 */
export const ConsentRegime = Enum.of({
  /** Opt-in: every optional category is undecided, so refused, until the visitor grants it. */
  Gdpr: "gdpr",
  /** Opt-out: an optional category with `defaultGranted` is granted until the visitor refuses it. */
  Ccpa: "ccpa",
});

/** One of the codes above. */
export type ConsentRegime = Enum.Value<typeof ConsentRegime>;
