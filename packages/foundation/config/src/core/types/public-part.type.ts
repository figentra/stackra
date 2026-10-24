/**
 * Stackra file contract:
 * Purpose: `PublicPart<C>`, the fields of a configuration whose `env` variable carries a public prefix (`VITE_`,
 *          `EXPO_PUBLIC_`, `RENDERER_VITE_`): what `hydrateEnv(C, raw, { only: "public" })` returns for the browser.
 * Boundary: a type only, read from the literal `env` map the class was declared with. A server variable, a field with
 *           no variable and every `@Secret` field are left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 and 10); ADR 0231 (decision 4); ADR 0173.
 */
import type { Fields, Schema } from "@stackra/validation";

import type { Config } from "#core/bases/config.base";
import type { PUBLIC_ENV_PREFIXES } from "#core/constants/public-env-prefixes.constant";

/** A variable name with a public prefix. */
type PublicName = `${(typeof PUBLIC_ENV_PREFIXES)[number]}${string}`;

/** The public fields of `C`, readonly. */
export type PublicPart<C extends Config> = C["~config"] extends {
  readonly schema: infer S extends Schema;
  readonly env: infer E;
}
  ? Readonly<
      Pick<
        Fields<S>,
        { [K in keyof E]: E[K] extends PublicName ? K : never }[keyof E] & keyof Fields<S>
      >
    >
  : never;
