/**
 * Stackra file contract:
 * Purpose: `RouteSubmit<R>`, what `useSubmit<typeof X>()` returns: a function that posts values to the route's
 *          `submit`, which a form adapter takes as its `submit`, with the post's state on it: pending, the data the
 *          submit handed back, and the field errors it named.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0165 (form adapters); ADR 0140 (field errors); ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";
import type { FieldErrors } from "@stackra/errors";

import type { Route } from "#core/bases/route.base";
import type { ClassInstance } from "#core/types/class-instance.type";
import type { SubmitData } from "#core/types/submit-data.type";

/** Posts to the `submit` of route class `R`. */
export type RouteSubmit<R extends AnyClass<Route>> = ((
  values: Readonly<Record<string, unknown>>,
) => Promise<void>) & {
  /** True while the post is in flight. */
  readonly isPending: boolean;
  /** What the last submit handed back; `undefined` before the first answer. */
  readonly data: SubmitData<ClassInstance<R>> | undefined;
  /** The field errors of the last answer, by path; empty when it named none. */
  readonly fieldErrors: FieldErrors;
};
