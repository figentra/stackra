/**
 * Stackra file contract:
 * Purpose: unit tests of `scaffoldTemplates` and of `scaffold` in a workspace without templates (an app made by
 *          `stackra create`, STA-1954): the workspace's own `tools/scaffold/templates` win, else the copy shipped in
 *          `@stackra/cli` (`dist/scaffold-templates`, which `tsdown.config.ts` copies), else a clear error; and a
 *          template kind renders into such a workspace from the shipped copy; the build config copies core's
 *          templates to that path, which the published `files` hold; a member rendered into a product points its
 *          catalog references at the product's catalogs.
 * Boundary: test only; writes throwaway workspaces in the OS temp directory and stands in a fake CLI package root.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0126 (scaffold templates); ADR 0515.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { cliPackageRoot } from "#node/functions/cli-package-root.function";
import type * as CliPackageRootModule from "#node/functions/cli-package-root.function";
import { SCAFFOLD_TEMPLATE_PATHS } from "#node/scaffold/constants/scaffold-template-paths.constant";
import { scaffold } from "#node/scaffold/functions/scaffold.function";
import { scaffoldTemplates } from "#node/scaffold/functions/scaffold-templates.function";

vi.mock("#node/functions/cli-package-root.function", async (original) => {
  const actual = await original<typeof CliPackageRootModule>();
  return { cliPackageRoot: vi.fn(actual.cliPackageRoot) };
});

/** Core's authored templates, the source of the shipped copy. */
const CORE = join(import.meta.dirname, "../../../../../../../..");
const AUTHORED = join(CORE, SCAFFOLD_TEMPLATE_PATHS.repository);

let scratch: string;

beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), "stackra-templates-"));
});

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
  vi.mocked(cliPackageRoot).mockClear();
});

describe("scaffoldTemplates", () => {
  it("takes the workspace's own templates first", () => {
    const own = join(scratch, "repo", SCAFFOLD_TEMPLATE_PATHS.repository);
    mkdirSync(own, { recursive: true });
    mkdirSync(join(scratch, "shipped"));
    expect(scaffoldTemplates(join(scratch, "repo"), join(scratch, "shipped"))).toBe(own);
  });

  it("falls back to the shipped copy when the workspace has none", () => {
    mkdirSync(join(scratch, "app"));
    mkdirSync(join(scratch, "shipped"));
    expect(scaffoldTemplates(join(scratch, "app"), join(scratch, "shipped"))).toBe(
      join(scratch, "shipped"),
    );
  });

  it("finds the shipped copy under the @stackra/cli package root by default", () => {
    const cli = join(scratch, "cli");
    mkdirSync(join(cli, SCAFFOLD_TEMPLATE_PATHS.shipped), { recursive: true });
    vi.mocked(cliPackageRoot).mockReturnValueOnce(cli);
    expect(scaffoldTemplates(join(scratch, "app"))).toBe(
      join(cli, SCAFFOLD_TEMPLATE_PATHS.shipped),
    );
  });

  it("refuses when neither exists, naming both places", () => {
    expect(() => scaffoldTemplates(join(scratch, "app"), join(scratch, "missing"))).toThrow(
      /no scaffold templates: tools\/scaffold\/templates is not in .*app and @stackra\/cli ships none at .*missing/,
    );
  });
});

describe("scaffold in a workspace without templates", () => {
  it("renders a template kind from the copy @stackra/cli ships", () => {
    const app = join(scratch, "app");
    mkdirSync(app);
    writeFileSync(join(app, "pnpm-workspace.yaml"), "packages: []\n");
    writeFileSync(join(app, "LICENSE"), "MIT\n");
    const cli = join(scratch, "cli");
    cpSync(AUTHORED, join(cli, SCAFFOLD_TEMPLATE_PATHS.shipped), { recursive: true });
    // One lookup per render: the default `shipped` argument of `scaffoldTemplates`.
    vi.mocked(cliPackageRoot).mockReturnValueOnce(cli).mockReturnValueOnce(cli);
    const made = scaffold({
      kind: "package",
      name: "loyalty",
      category: "commerce",
      entries: "react",
      data: true,
      home: app,
      description: "Loyalty points.",
      summary: "Reach for it to reward repeat buyers.",
      format: false,
    });
    expect(made.rel).toBe("packages/commerce/loyalty");
    expect(made.files).toEqual(
      expect.arrayContaining([
        "package.json",
        "src/react/README.md",
        "src/node/database/migrations/README.md",
        "LICENSE",
      ]),
    );
    expect(existsSync(join(app, "packages/commerce/loyalty/package.json"))).toBe(true);
    expect(readFileSync(join(app, "packages/commerce/loyalty/LICENSE"), "utf8")).toBe("MIT\n");
    const docs = scaffold({
      kind: "app:docs",
      name: "handbook",
      home: app,
      description: "A handbook.",
      summary: "Use it for the handbook.",
      format: false,
    });
    expect(docs.files).toContain("src/config/docs.config.ts");
    expect(existsSync(join(app, "apps/handbook/src/config/docs.config.ts"))).toBe(true);
  });
});

describe("scaffold into a product's catalogs", () => {
  it("points the template's catalog references at the product's catalogs and names what none holds", () => {
    const app = join(scratch, "app");
    mkdirSync(app);
    writeFileSync(
      join(app, "pnpm-workspace.yaml"),
      "catalogs:\n  default:\n    react: 19.2.0\n    react-dom: 19.2.0\n  build:\n    vite: 8.0.0\n",
    );
    const made = scaffold({
      kind: "app:console",
      name: "backoffice",
      home: CORE,
      root: app,
      description: "The back office.",
      summary: "Use it for staff screens.",
      format: false,
    });
    const pkg = JSON.parse(readFileSync(join(app, "apps/backoffice/package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.dependencies["react"]).toBe("catalog:");
    expect(pkg.dependencies["react-dom"]).toBe("catalog:");
    expect(pkg.devDependencies["vite"]).toBe("catalog:build");
    expect(made.missing).toContain(`@heroui/react@${pkg.dependencies["@heroui/react"]}`);
    expect(made.missing.some((ref) => ref.startsWith("react@"))).toBe(false);
  });

  it("names a package after the product and takes the framework from catalog stackra", () => {
    const app = join(scratch, "app");
    mkdirSync(app);
    writeFileSync(join(app, "runway.yaml"), "product:\n  key: velora\n");
    writeFileSync(
      join(app, "pnpm-workspace.yaml"),
      'catalogs:\n  stackra:\n    "@stackra/vitest-config": 0.33.1\n    "@stackra/typescript-config": 0.33.1\n',
    );
    scaffold({
      kind: "package",
      name: "points",
      category: "commerce",
      home: CORE,
      root: app,
      description: "Points.",
      summary: "Reach for it for points.",
      format: false,
    });
    const pkg = JSON.parse(
      readFileSync(join(app, "packages/commerce/points/package.json"), "utf8"),
    ) as {
      name: string;
      devDependencies: Record<string, string>;
    };
    expect(pkg.name).toBe("@figentra/velora-points");
    expect(pkg.devDependencies["@stackra/vitest-config"]).toBe("catalog:stackra");
    expect(pkg.devDependencies["@stackra/typescript-config"]).toBe("catalog:stackra");
  });
});

describe("the build", () => {
  it("copies core's templates to the shipped path, inside the published files", async () => {
    const PACKAGE = join(import.meta.dirname, "../../../../..");
    const config = (await import(new URL("../../../../../tsdown.config.ts", import.meta.url).href))
      .default as {
      copy?: readonly { from: string; to: string; rename: string }[];
    };
    expect(config.copy).toHaveLength(1);
    const [entry] = config.copy ?? [];
    expect(join(PACKAGE, entry?.from ?? "")).toBe(AUTHORED);
    expect(existsSync(AUTHORED)).toBe(true);
    expect(join(entry?.to ?? "", entry?.rename ?? "")).toBe(SCAFFOLD_TEMPLATE_PATHS.shipped);
    const manifest = JSON.parse(readFileSync(join(PACKAGE, "package.json"), "utf8")) as {
      files: string[];
    };
    expect(manifest.files).toContain(SCAFFOLD_TEMPLATE_PATHS.shipped.split("/")[0]);
  });
});
