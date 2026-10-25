/**
 * Stackra file contract:
 * Purpose: `DocumentResolver`, how a route's `document:` class becomes what its page renders: the tenant's published
 *          version of the document, or the coded class when there is none.
 * Boundary: a type only; registered by the package that owns documents (`registerDocumentResolver`). Without one a
 *           document route renders the coded class.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (documents); ADR 0114 (page builder); ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";

import type { Route } from "#core/bases/route.base";
import type { RouteContext } from "#core/types/route-context.type";

/** Resolves a document route's document for one request. */
export type DocumentResolver = (document: AnyClass, ctx: RouteContext<Route>) => unknown;
