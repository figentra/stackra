/**
 * Stackra file contract:
 * Purpose: unit tests of `listUpgradeSources`: TypeScript and JavaScript files only, sorted, never inside
 *          `node_modules`, build output or a dot folder such as gen's `.stackra/`.
 * Boundary: test only; writes a workspace under the OS temp folder and removes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import { describe, expect, it } from "@stackra/testing";

import { fixtureWorkspace } from "#node/upgrade/functions/__tests__/fixture-workspace";
import { listUpgradeSources } from "#node/upgrade/functions/list-upgrade-sources.function";

describe("listUpgradeSources", () => {
  it("lists the source files and skips installs, build output and dot folders", () => {
    const { root, remove } = fixtureWorkspace({
      "apps/web/src/main.tsx": "",
      "apps/web/src/legacy.cjs": "",
      "apps/web/src/styles.css": "",
      "apps/web/dist/main.js": "",
      "apps/web/.stackra/gen/i18n.ts": "",
      "node_modules/x/index.js": "",
      "services/a/stackra-encore/a/encore.service.ts": "",
      "services/a/src/a.service.mts": "",
      "stackra.config.ts": "",
    });
    try {
      expect(listUpgradeSources(root)).toEqual([
        "apps/web/src/legacy.cjs",
        "apps/web/src/main.tsx",
        "services/a/src/a.service.mts",
        "stackra.config.ts",
      ]);
    } finally {
      remove();
    }
  });
});
