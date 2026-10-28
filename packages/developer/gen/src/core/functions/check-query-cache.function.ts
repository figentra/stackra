/**
 * Stackra file contract:
 * Purpose: `checkQueryCache`, the refusal `site_cache_reads_caller`: a query cached `per: CacheScope.Site` shares one
 *          entry with every caller of a site, so it must not read the caller from its `handle` context (`actor`,
 *          `scopeId`, `scope`, `authorize`, `deviceId`, `assurance`, `client`) or take a caller id as input
 *          (`actorId`, `userId`, `principalId`, `customerId`, `scopeId`, `tenantId`).
 * Boundary: pure; reads the member's own query classes (their `cache` option, the caller reads discovery recorded and
 *           the input shape's fields). A hosted package's queries are checked when gen runs on that package. Runs in
 *           the full pass beside the other checks, never in the manifest pass.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 31, as amended 2026-10-28; Enforcement: STA-340 `site_cache_reads_caller`); ADR
 *                     0297 (decision 3: the public key of a site); ADR 0294 (decision 22: a refusal carries its fix).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** `CacheScope.Site` of @stackra/actions, as the options reader evaluates it. */
const SITE = "site";

/** An input field that names a caller. */
const CALLER_INPUT = /^(?:actor|user|principal|customer|scope|tenant)Id$/;

/**
 * The query cache refusals of `ir`.
 *
 * @example
 * checkQueryCache(ir).map((error) => error.code); // ["site_cache_reads_caller"]
 */
export function checkQueryCache(ir: MemberIR): GenError[] {
  return ir.classes
    .filter((declared) => declared.kind === "query")
    .flatMap((declared) => {
      const cache = declared.options["cache"] as { readonly per?: unknown } | undefined;
      if (cache?.per !== SITE) return [];
      const input = ir.shapes.find(
        (shape) => shape.name === declared.handle?.input && shape.module === declared.module,
      );
      const reads = [
        ...(declared.callerReads ?? []).map((name) => `ctx.${name}`),
        ...(input?.fields ?? [])
          .filter((field) => CALLER_INPUT.test(field.name))
          .map((field) => `input.${field.name}`),
      ];
      return reads.length === 0
        ? []
        : [
            {
              code: "site_cache_reads_caller",
              file: declared.file,
              line: 0,
              column: 0,
              subject: declared.name,
              message: `${declared.name} is cached per CacheScope.Site, one entry for every caller of a site, but reads the caller (${reads.join(", ")})`,
              fix: "stop reading the caller in a site-cached query, or cache it per CacheScope.Principal (the default) or CacheScope.Scope",
            },
          ];
    });
}
