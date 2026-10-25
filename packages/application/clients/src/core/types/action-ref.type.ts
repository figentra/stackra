/**
 * Stackra file contract:
 * Purpose: `ActionRef<I, O>`, the class `actionRef`, `ClientAction` and `remoteAction` return: a consumed action read by
 *          its statics (versioned key, derived permission, input and output schemas, route, risk, texts).
 * Boundary: a type only. It satisfies `@stackra/query`'s `OfflineActionRef` structurally (a static `key`), so the
 *           offline map and the mutation queue take it. A ref is never instantiated; its instance type is `object`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 4); ADR 0294 (decision 20: derived permission); ADR 0059 (offline).
 */
import type { EndpointOptions } from "@stackra/actions";
import type { Risk } from "@stackra/iam";
import type { ZodType } from "zod";

import type { ActionTexts } from "#core/types/action-texts.type";

/** A consumed action class. */
export type ActionRef<
  I extends ZodType = ZodType,
  O extends ZodType = ZodType,
> = (abstract new () => object) & {
  /** Tells an action ref from a query ref. */
  readonly kind: "action";

  /** The versioned key (`orders.order.cancel@1`). */
  readonly key: string;

  /** The permission derived from the key (`orders.order.cancel`). */
  readonly permission: string;

  /** The input schema. */
  readonly input: I;

  /** The output schema. */
  readonly output: O;

  /** The route, when the action has one. */
  readonly endpoint?: EndpointOptions;

  /** The risk code of the permission (`l2`). */
  readonly risk?: Risk;

  /** The confirmation, success and queued texts. */
  readonly texts: ActionTexts;
};
