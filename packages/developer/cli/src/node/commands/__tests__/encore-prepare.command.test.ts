/**
 * Stackra file contract:
 * Purpose: unit tests of `EncorePrepareCommand`: in a service folder it pins `encore.dev` to the default catalog's
 *          version, writes tsconfig `paths` from `imports` with no `baseUrl` (keeping the header comments, above the
 *          object or inside its braces), and a second
 *          run changes nothing.
 * Boundary: test only; writes a temporary workspace.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2, amendment of 2026-11-09).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { EncorePrepareCommand } from "#node/commands/encore-prepare.command";

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("EncorePrepareCommand", () => {
  it("pins encore.dev and mirrors imports into tsconfig paths, then changes nothing", async () => {
    root = mkdtempSync(join(tmpdir(), "stackra-cli-encore-"));
    const service = join(root, "services/orders");
    mkdirSync(service, { recursive: true });
    writeFileSync(join(root, "pnpm-workspace.yaml"), "catalog:\n  encore.dev: 1.58.8\n");
    writeFileSync(
      join(service, "package.json"),
      JSON.stringify({
        name: "@figentra/service-orders",
        imports: { "#src/*": ["./src/*", "./src/*.ts"], "#stackra/*": "./.stackra/gen/*" },
        dependencies: { "encore.dev": "catalog:" },
      }),
    );
    writeFileSync(
      join(service, "tsconfig.json"),
      // an older prepare's baseUrl, which TypeScript 7 refuses: prepare removes it
      '// header\n{ "extends": "@stackra/typescript-config/node", "compilerOptions": { "baseUrl": "." } }\n',
    );

    const first = await runCommandForTest([EncorePrepareCommand], ["encore:prepare", "--json"], {
      cwd: service,
    });
    expect(first.json).toEqual({ ok: true, data: { changed: ["package.json", "tsconfig.json"] } });
    const pkg = JSON.parse(readFileSync(join(service, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["encore.dev"]).toBe("1.58.8");
    const tsconfig = readFileSync(join(service, "tsconfig.json"), "utf8");
    expect(tsconfig.startsWith("// header\n")).toBe(true);
    expect(JSON.parse(tsconfig.replace(/^\/\/.*\n/, ""))).toEqual({
      extends: "@stackra/typescript-config/node",
      compilerOptions: {
        // each key's first target only: Encore reads no further (ADR 0091 rule 4, corrected 2026-11-10)
        paths: { "#src/*": ["./src/*"], "#stackra/*": ["./.stackra/gen/*"] },
      },
    });
    // laid out as the formatter leaves it: a short array on its line
    expect(tsconfig).toContain('    "#src/*": ["./src/*"],\n');

    const second = await runCommandForTest([EncorePrepareCommand], ["encore:prepare", "--json"], {
      cwd: service,
    });
    expect(second.json).toEqual({ ok: true, data: { changed: [] } });
  });

  it("keeps a file contract written inside the tsconfig's braces, where the formatter leaves it", async () => {
    root = mkdtempSync(join(tmpdir(), "stackra-cli-encore-"));
    const service = join(root, "services/messaging");
    mkdirSync(service, { recursive: true });
    writeFileSync(join(root, "pnpm-workspace.yaml"), "catalog:\n  encore.dev: 1.58.8\n");
    writeFileSync(
      join(service, "package.json"),
      JSON.stringify({
        name: "@figentra/service-messaging",
        imports: { "#src/*": "./src/*" },
        dependencies: { "encore.dev": "1.58.8" },
      }),
    );
    // NOTIFY's services write the contract as the object's first lines
    writeFileSync(
      join(service, "tsconfig.json"),
      [
        "{",
        "  // Stackra file contract:",
        "  // Purpose: TypeScript settings of the messaging service: the service preset.",
        '  "extends": "@stackra/typescript-config/service"',
        "}",
        "",
      ].join("\n"),
    );

    await runCommandForTest([EncorePrepareCommand], ["encore:prepare", "--json"], { cwd: service });
    expect(readFileSync(join(service, "tsconfig.json"), "utf8")).toBe(
      [
        "{",
        "  // Stackra file contract:",
        "  // Purpose: TypeScript settings of the messaging service: the service preset.",
        '  "extends": "@stackra/typescript-config/service",',
        '  "compilerOptions": {',
        '    "paths": {',
        '      "#src/*": ["./src/*"]',
        "    }",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
  });
});
