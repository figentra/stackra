/**
 * Stackra file contract:
 * Purpose: the `config-infisical-store-removed` codemod fixture (0.19.0): each removed Infisical name imported from
 *          `@stackra/config` is reported (`InfisicalConfig$` included); another name from the same import and the same
 *          names from another module are not.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); ADR 0525; STA-145; changeset cb26737.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const config = `import { Config, InfisicalConfig, InfisicalConfig$, InfisicalSecretStoreDriver } from "@stackra/config";
import type { InfisicalOptions } from "@stackra/config";
import { InfisicalConfig as Other } from "./vendor/infisical";

export const drivers = [InfisicalSecretStoreDriver, InfisicalConfig, InfisicalConfig$, Config, Other];
export type Options = InfisicalOptions;
`;

export const CONFIG_INFISICAL_STORE_REMOVED_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "services/orders/src/config/secrets.config.ts",
      before: config,
      after: config,
      findings: ["1:18", "1:35", "1:53", "2:15"],
    },
  ],
};
