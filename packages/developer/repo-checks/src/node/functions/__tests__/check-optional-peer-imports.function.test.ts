/**
 * Stackra file contract:
 * Purpose: unit tests of `checkOptionalPeerImports` and `valueImportsOf`: a static value import of an optional peer in a
 *          general entry is refused, naming the file and the peer (config's 0.32.0 Secrets Manager import); a dynamic
 *          `import()`, an `import type`, a platform entry, a required peer and a framework peer are not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkOptionalPeerImports } from "#node/functions/check-optional-peer-imports.function";
import { valueImportsOf } from "#node/functions/value-imports-of.function";

const pkg = {
  name: "@stackra/config",
  peerDependencies: {
    "@aws-sdk/client-secrets-manager": "catalog:",
    electron: "catalog:",
    react: "catalog:",
    "@stackra/integrations": "workspace:*",
  },
  peerDependenciesMeta: {
    "@aws-sdk/client-secrets-manager": { optional: true },
    electron: { optional: true },
    react: { optional: true },
  },
};

describe("checkOptionalPeerImports", () => {
  it("refuses a static value import of an optional peer in a general entry, naming the file and the peer", () => {
    const findings = checkOptionalPeerImports({
      pkg,
      sources: [
        {
          path: "src/node/drivers/aws-secrets-manager-secret-store.driver.ts",
          text: 'import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";',
        },
      ],
    });
    expect(findings).toEqual([
      expect.stringContaining(
        "src/node/drivers/aws-secrets-manager-secret-store.driver.ts imports a value of the optional peer @aws-sdk/client-secrets-manager eagerly",
      ),
    ]);
  });

  it("passes a dynamic import, a type import, a platform entry, a required peer and a framework peer", () => {
    expect(
      checkOptionalPeerImports({
        pkg,
        sources: [
          {
            path: "src/node/drivers/lazy.driver.ts",
            text: 'const { SecretsManagerClient } = await import("@aws-sdk/client-secrets-manager");',
          },
          {
            path: "src/node/types/client.type.ts",
            text: 'import type { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";',
          },
          { path: "src/desktop/window.ts", text: 'import { BrowserWindow } from "electron";' },
          {
            path: "src/core/receiver.ts",
            text: 'import { Integration } from "@stackra/integrations";',
          },
          { path: "src/core/hook.ts", text: 'import { useState } from "react";' },
        ],
      }),
    ).toEqual([]);
  });
});

describe("valueImportsOf", () => {
  it("lists value imports and re-exports, not type-only ones or dynamic imports", () => {
    expect(
      valueImportsOf(
        [
          'import { A } from "a";',
          'import type { B } from "b";',
          'import { type C, type D } from "c";',
          'import { type E, F } from "e";',
          'export { G } from "g";',
          'export type { H } from "h";',
          'const i = await import("i");',
        ].join("\n"),
      ),
    ).toEqual(["a", "e", "g"]);
  });
});
