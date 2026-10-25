/**
 * Stackra file contract:
 * Purpose: `BlockProps<typeof XBlock>`, the props the renderer gives a block's component: the block's fields as the
 *          visitor sees them (every `LocalizedText` already a string, nested shapes as plain data) plus `data`, the
 *          output of the query the block accepts.
 * Boundary: a type only, derived from the block class, so a component typed by it needs no Props file (ADR 0305 rule
 *           12 allows either). A string-keyed map of strings is read as `LocalizedText`, as the renderer reads it. The
 *           native entry adds `onEvent`, because a native block never navigates by itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 12 and 37); ADR 0110 (decisions 1 and 2); ADR 0294 (decision 26: `Fields`).
 */
import type { QueryOutput, QueryRef } from "@stackra/clients";
import type { Fields } from "@stackra/validation";

import type { BlockClass } from "#core/types/block-class.type";

/** A value no mapping looks into. */
type Leaf = string | number | boolean | bigint | symbol | null | undefined | Date;

/** `V` with every `LocalizedText` read as the visitor's string, recursively. */
type Localized<V> = V extends Leaf
  ? V
  : V extends readonly (infer E)[]
    ? readonly Localized<E>[]
    : string extends keyof V
      ? V[keyof V] extends string
        ? string
        : V
      : { readonly [K in keyof V]: Localized<V[K]> };

/** `{ data }` typed by the query `B` accepts; nothing for a block that accepts none. */
type AcceptedData<B> = B extends { readonly "~accepts"?: infer Q }
  ? [NonNullable<Q>] extends [never]
    ? unknown
    : NonNullable<Q> extends QueryRef
      ? {
          /** The accepted query's answer for the node's input. */
          readonly data: QueryOutput<NonNullable<Q>>;
        }
      : unknown
  : unknown;

/**
 * The props of the component that renders the block `B`.
 *
 * @example
 * export class WelcomeHero extends Component<BlockProps<typeof WelcomeHeroBlock>> {
 *   render() {
 *     return <Card.Title>{this.i18n.t(this.props.titleKey)}</Card.Title>;
 *   }
 * }
 */
export type BlockProps<B extends BlockClass> = Localized<Fields<InstanceType<B>>> & AcceptedData<B>;
