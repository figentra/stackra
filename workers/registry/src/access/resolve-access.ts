/**
 * Stackra file contract:
 * Purpose: `resolveAccess`: the read rule of `name` for one request: its scope row with a `name_rules` override applied
 *          (such as `@stackra-pro/ui` `internal`) and the `readAccess` outcome; null for an unknown scope. The one
 *          resolution behind the npm routes (`gate`) and the registry browser's package page.
 * Boundary: decides; reads D1 through the store and the licence only through the `LicenceCheck` port.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13); ADR 0461 (decision 3).
 */
import { readAccess } from "#src/access/read-access";
import { splitName } from "#src/http/split-name";
import type { ReadAccess } from "#src/interfaces/read-access.type";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import type { ScopeRow } from "#src/interfaces/scope-row.interface";

/**
 * The read rule of `name` for one request, or null for an unknown scope.
 *
 * @example
 * const resolved = await resolveAccess(deps, request, "@stackra-pro/sync");
 */
export async function resolveAccess(
  deps: RegistryDeps,
  request: Request,
  name: string,
): Promise<{ readonly scope: ScopeRow; readonly access: ReadAccess } | null> {
  const [row, nameRule] = await Promise.all([
    deps.store.scope(splitName(name).scope),
    deps.store.nameRule(name),
  ]);
  if (row === null) return null;
  const scope: ScopeRow = nameRule === null ? row : { ...row, read_rule: nameRule };
  const access = await readAccess(
    scope,
    name,
    request.headers.get("authorization"),
    deps.licences,
    deps.settings,
    deps.now(),
  );
  return { scope, access };
}
