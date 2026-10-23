/**
 * Stackra file contract:
 * Purpose: a registry: the icons one platform can draw, keyed by `IconName`. It holds only the names an app uses
 *          (gen will emit exactly those), so a name missing from it is a name the app never asked for.
 * Boundary: types only; building one is `defineIconRegistry`, reading one is `findIcon`.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets: only the icons used are bundled).
 */
import type { IconComponent } from "#contracts/types/icon-component.type";
import type { IconName } from "#contracts/types/icon-name.type";

/** The components a platform can draw for some icon names; a name left out has no entry. */
export type IconRegistry = Readonly<Partial<Record<IconName, IconComponent>>>;
