/**
 * Stackra file contract:
 * Purpose: `ViewsRecord<R>`, the builder a resource's `views(v)` member receives: the runtime side of `Views<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 9).
 */
import { ViewRecord } from "#core/records/view.record";
import type { Path } from "#core/types/path.type";
import type { Views } from "#core/types/views.type";

/** Builds preset views over row type `R`. */
export class ViewsRecord<R> implements Views<R> {
  /** A preset view. */
  view(name: string, filter: { readonly [K in Path<R>]?: unknown }): ViewRecord<R> {
    return new ViewRecord<R>(name, filter as Readonly<Record<string, unknown>>);
  }
}
