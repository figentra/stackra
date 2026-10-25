/**
 * Stackra file contract:
 * Purpose: `InferParams<R>`, the params of route class `R` from its `params` shape class or its path: what gen's
 *          `RouteParams` map and React Navigation's param list are built from.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0165 (React Navigation on mobile).
 */
import type { AnyClass } from "@stackra/container";

import type { Route } from "#core/bases/route.base";
import type { ParamsOf } from "#core/types/params-of.type";

/** The params of route class `R`. */
export type InferParams<R extends AnyClass<Route>> = ParamsOf<InstanceType<R>>;
