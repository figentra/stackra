/**
 * Stackra file contract:
 * Purpose: `CustomFieldTarget`, what a set of custom field definitions belongs to: a model key alone
 *          (`catalogue.product`), or a model key with the `subtype` its records are split into at runtime (a content
 *          type key such as `blog_post`), each subtype with its own definitions.
 * Boundary: a type only. A bare model key and `{ model }` mean the same target; `CustomFieldService` checks both keys.
 * Runtime: isomorphic
 * Governing contract: ADR 0116 (decision CT2) as amended by ADR 0226 (decision 1: types defined at runtime are data).
 */

/** A model key, or a model key and one of its runtime subtypes. */
export type CustomFieldTarget =
  | string
  | {
      /** The model key (`entries.entry`). */
      readonly model: string;
      /** The runtime type key (`blog_post`); left out for the whole model. */
      readonly subtype?: string;
    };
