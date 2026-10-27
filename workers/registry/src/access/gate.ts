/**
 * Stackra file contract:
 * Purpose: `gate`: the scope read rule for `name`: the scope and licence, or the refusal response (404 for an unknown
 *          scope).
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { readAccess } from "#src/access/read-access";
import { failure } from "#src/http/failure";
import { splitName } from "#src/http/split-name";
import type { LicenceView } from "#src/interfaces/licence-view.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import type { ScopeRow } from "#src/interfaces/scope-row.interface";

/** A passed read check. */
interface Gate {
  readonly scope: ScopeRow;
  readonly licence: LicenceView | null;
}

/**
 * The scope read rule for `name`: the scope and licence, or the refusal response (404 for an unknown scope).
 */
export async function gate(
  deps: RegistryDeps,
  request: Request,
  name: string,
): Promise<Gate | Response> {
  const scope = await deps.store.scope(splitName(name).scope);
  if (scope === null) return failure(404, "not_found");
  const access = await readAccess(
    scope,
    name,
    request.headers.get("authorization"),
    deps.licences,
    deps.settings,
    deps.now(),
  );
  if (access.allowed) return { scope, licence: access.licence };
  return failure(
    access.status,
    access.reason,
    access.status === 401 ? { "www-authenticate": `Bearer realm="${deps.settings.host}"` } : {},
  );
}
