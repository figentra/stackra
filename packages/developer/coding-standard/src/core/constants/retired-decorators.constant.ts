/**
 * Stackra file contract:
 * Purpose: `RETIRED_DECORATORS`, the retired decorator names that are not themselves kind bases, for
 *          `no-kind-decorator` (a kind base name used as a decorator is refused through `KIND_BASES`).
 * Boundary: data only. The allowed vocabulary (field, method and class-facet decorators) is not listed here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R6, the retired kind decorators; decision 23, no Guard or Gate); ADR 0305
 *                     (rule 33, no cache decorators); ADR 0307 (rule 23, `ConnectionRef<C>` is a type).
 */

/**
 * Decorator names that no Stackra code writes any more, beyond the kind base names: retired kind decorators,
 * DI decorators, string-token helpers and the old job, cache and lock decorators.
 */
export const RETIRED_DECORATORS: readonly string[] = Object.freeze([
  "App",
  "AsEndpoint",
  "AsJob",
  "AsTool",
  "CacheEvict",
  "Cacheable",
  "ConnectionRef",
  "ContextProvider",
  "Cron",
  "Crud",
  "DriverOf",
  "Event",
  "Gate",
  "Guard",
  "HasState",
  "Hook",
  "HookPoint",
  "Inject",
  "Injectable",
  "Job",
  "Json",
  "Link",
  "Mail",
  "MoneyColumn",
  "OnEvent",
  "Override",
  "Permission",
  "PriceModel",
  "Provider",
  "Queue",
  "Requires",
  "Upcast",
  "Version",
  "WithLock",
]);
