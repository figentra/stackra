/**
 * Stackra file contract:
 * Purpose: unit tests of `planDevSurface`: a published shell URL inside the surface's line, a local checkout's shell
 *          dev server started beside Vite, the API from the gateway port or `--api`, and the refusals.
 * Boundary: test only; writes a fake OS checkout into a temporary folder; starts nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decisions 5 and 6).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { planDevSurface } from "#node/dev-surface/functions/plan-dev-surface.function";
import type { RootSurface } from "#node/dev-surface/types/root-surface.type";
import { CliUsageError } from "#node/errors/cli-usage.error";

const ENTRY: RootSurface = {
  shell: { owner: "os", name: "console", line: 3 },
  packages: ["@acme/console-ui"],
  gatewayPort: 4000,
};

const VITE = { command: "vite", args: ["--config", ".stackra/surfaces/console/vite.config.ts"] };

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-plan-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("planDevSurface", () => {
  it("loads a published shell from the origin, in the surface's line by default", () => {
    const plan = planDevSurface(root, "console", ENTRY, {
      shellOrigin: "https://shells.example.test/assets",
    });
    expect(plan.descriptor).toEqual({
      surface: "console",
      shell: {
        ref: "os/console@3",
        url: "https://shells.example.test/assets/os/console@3/",
        local: false,
      },
      packages: ["@acme/console-ui"],
      api: "http://localhost:4000/",
    });
    expect(plan.runs).toEqual([{ ...VITE, cwd: root }]);
  });

  it("pins a published version inside the line and refuses one outside it", () => {
    const plan = planDevSurface(root, "console", ENTRY, {
      shellOrigin: "https://shells.example.test",
      shell: "3.4.1",
    });
    expect(plan.descriptor.shell.url).toBe("https://shells.example.test/os/console@3.4.1/");
    expect(() =>
      planDevSurface(root, "console", ENTRY, {
        shellOrigin: "https://shells.example.test",
        shell: "4.0.0",
      }),
    ).toThrow(/outside the surface's line/);
  });

  it("runs a local checkout's shell, which serves the packages' surface entries from source", () => {
    const app = join(root, "os", "apps", "console");
    mkdirSync(app, { recursive: true });
    writeFileSync(join(app, "runway.yaml"), "environments:\n  dev:\n    port: 5180\n");
    const pkg = join(root, "packages", "application", "console-ui");
    mkdirSync(pkg, { recursive: true });
    writeFileSync(
      join(pkg, "package.json"),
      JSON.stringify({
        name: "@acme/console-ui",
        exports: {
          "./console": { "@stackra/source": "./src/console.tsx", default: "./dist/console.mjs" },
        },
      }),
    );
    const plan = planDevSurface(
      root,
      "console",
      { ...ENTRY, product: "acme", preset: "portal" },
      {
        os: "os",
        api: "http://127.0.0.1:9000",
      },
    );
    expect(plan.descriptor).toEqual({
      surface: "console",
      shell: { ref: "os/console@3", url: "http://localhost:5180/", local: true },
      packages: ["@acme/console-ui"],
      api: "http://127.0.0.1:9000/",
      product: "acme",
      root,
      entries: [join(pkg, "src/console.tsx")],
      preset: "portal",
    });
    expect(plan.runs).toEqual([
      {
        command: "vite",
        args: ["--port", "5180", "--strictPort"],
        cwd: app,
        env: { STACKRA_DEV_SURFACE: join(root, ".stackra/surfaces/console/dev-surface.json") },
      },
    ]);
  });

  it("serves a content-only landing site with its seed document", () => {
    const app = join(root, "os", "apps", "landing");
    mkdirSync(app, { recursive: true });
    writeFileSync(join(app, "runway.yaml"), "environments:\n  dev:\n    port: 5181\n");
    mkdirSync(join(root, "assets", "landing"), { recursive: true });
    for (const file of ["about.json", "index.json"])
      writeFileSync(join(root, "assets", "landing", file), "{}");
    const plan = planDevSurface(
      root,
      "landing",
      {
        ...ENTRY,
        shell: { owner: "os", name: "landing", line: 1 },
        packages: [],
        content: "assets/landing",
      },
      { os: "os" },
    );
    expect(plan.descriptor.entries).toEqual([]);
    expect(plan.descriptor.document).toBe(join(root, "assets", "landing", "index.json"));
  });

  it("refuses conflicting or missing shell and API settings", () => {
    const cases = [
      { os: "os", shell: "3" },
      { os: "missing" },
      {},
      { shellOrigin: "not a url" },
      { shellOrigin: "file:///tmp" },
    ];
    const dir = root;
    for (const options of cases) {
      expect(() => planDevSurface(dir, "console", ENTRY, options)).toThrow(CliUsageError);
    }
    expect(() =>
      planDevSurface(
        root,
        "console",
        { ...ENTRY, gatewayPort: undefined },
        {
          shellOrigin: "https://shells.example.test",
        },
      ),
    ).toThrow(/no local API/);
  });
});
