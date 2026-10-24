/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/clients (the query, paginated query, query client, action
 *          and intent router hooks with their option and result types) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing; imports `core` and `contracts`, never another entry.
 * Runtime: browser, react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useAction } from "#react/action/use-action";
export type { UseActionOptions } from "#react/action/use-action-options.type";
export type { UseActionResult } from "#react/action/use-action-result.type";
export { useInfiniteQuery } from "#react/infinite-query/use-infinite-query";
export type { UseInfiniteQueryOptions } from "#react/infinite-query/use-infinite-query-options.type";
export type { UseInfiniteQueryResult } from "#react/infinite-query/use-infinite-query-result.type";
export type { IntentMatch } from "#react/intent-router/intent-match.type";
export { useIntentRouter } from "#react/intent-router/use-intent-router";
export type { UseQueryOptions } from "#react/query/use-query-options.type";
export type { UseQueryResult } from "#react/query/use-query-result.type";
export { useQuery } from "#react/query/use-query";
export type { ClientQueries } from "#react/query-client/client-queries.type";
export { useQueryClient } from "#react/query-client/use-query-client";
