/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/clients (the React Native `useQuery`, which refetches when
 *          the app returns to the foreground, and `useAction`, with their option and result types) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `useAction` and the four types are the isomorphic ones the
 *           `./react` entry declares, re-exported so a native screen takes its data hooks from one entry, as
 *           `@stackra/ui/native` does with its shared hooks.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0164 (native parity); the STA-347 stand-in barrel decision.
 */
export { useAction } from "#react/action/use-action";
export type { UseActionOptions } from "#react/action/use-action-options.type";
export type { UseActionResult } from "#react/action/use-action-result.type";
export { useQuery } from "#native/query/use-query";
export type { UseQueryOptions } from "#react/query/use-query-options.type";
export type { UseQueryResult } from "#react/query/use-query-result.type";
