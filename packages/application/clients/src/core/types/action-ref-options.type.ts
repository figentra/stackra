/**
 * Stackra file contract:
 * Purpose: `ActionRefOptions<I, O>`, the second argument of `actionRef`: the input and output, the route, the risk and
 *          the texts.
 * Boundary: a type only. `confirm` and `success` at the top level are the short form of `texts`; both end up in the
 *           ref's `texts`. `risk` is the producer's risk code (`Risk.L2`, from `@stackra/iam`).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0139 (risk and confirmation); the HTTP conventions rule.
 */
import type { EndpointOptions } from "@stackra/actions";
import type { I18nKey } from "@stackra/i18n";
import type { Risk } from "@stackra/iam";

import type { ActionTexts } from "#core/types/action-texts.type";
import type { RefSchema } from "#core/types/ref-schema.type";

/** What an action ref declares. */
export interface ActionRefOptions<I extends RefSchema, O extends RefSchema> {
  /** The input schema or shape class. */
  readonly input: I;

  /** The output schema or shape class. */
  readonly output: O;

  /** The route; absent when the action has none, so only an in-process transport can call it. */
  readonly http?: EndpointOptions;

  /** The risk code of the action's permission (`l0` to `l4`). */
  readonly risk?: Risk;

  /** The confirmation, success and queued texts. */
  readonly texts?: ActionTexts;

  /** Short form of `texts.confirm`. */
  readonly confirm?: I18nKey;

  /** Short form of `texts.success`. */
  readonly success?: I18nKey;
}
