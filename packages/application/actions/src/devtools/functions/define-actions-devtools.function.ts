/**
 * Stackra file contract:
 * Purpose: `defineActionsDevtools`, the devtools entry of @stackra/actions: the `actions.registry` tab, each action and
 *          query gen registered with its locked key, kind, class, permission, risk, effect tags and input schema class.
 * Boundary: data only, no UI and no Pro import; the Pro panel (@stackra-pro/devtools) finds the tab through the kit's
 *           host session. Names only, read from the registry when a host opens the tab. Development only (ADR 0246
 *           decision 1). It takes the kit by shape (`DevtoolsTabSink`), the same as container and events.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 3 and 4: the console shows actions); ADR 0461; ADR 0294 (decisions 10, 20
 *                     and 22: the derived identities).
 */
import { kindOf } from "@stackra/container";
import type { DevtoolsTabSink } from "@stackra/container/devtools";

import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";

/**
 * Defines the actions devtools tab.
 *
 * @param kit - the devtools kit (`DevtoolsKit`), or anything with its `defineTab`.
 * @returns removes the tab.
 * @example
 * defineActionsDevtools(container.get(DevtoolsKit));
 */
export function defineActionsDevtools(kit: DevtoolsTabSink): () => void {
  return kit.defineTab({
    id: "actions.registry",
    title: "Actions and queries",
    category: "actions",
    read: () =>
      [...ACTION_REGISTRY.values()].map((row) => ({
        key: row.key,
        kind: kindOf(row.type)?.kind,
        type: row.type.name,
        permission: row.permission,
        risk: row.risk,
        effects: row.effects ?? [],
        input: row.input?.name,
      })),
  });
}
