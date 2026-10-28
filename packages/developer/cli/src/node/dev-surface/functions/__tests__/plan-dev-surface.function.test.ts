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

  it("runs a local checkout's shell beside Vite", () => {
    const app = join(root, "os", "apps", "console");
    mkdirSync(app, { recursive: true });
    writeFileSync(join(app, "runway.yaml"), "environments:\n  dev:\n    port: 5180\n");
    const plan = planDevSurface(root, "console", ENTRY, { os: "os", api: "http://127.0.0.1:9000" });
    expect(plan.descriptor.shell).toEqual({
      ref: "os/console@3",
      url: "http://localhost:5180/",
      local: true,
    });
    expect(plan.descriptor.api).toBe("http://127.0.0.1:9000/");
    expect(plan.runs).toEqual([
      { command: "stackra", args: ["dev"], cwd: app },
      { ...VITE, cwd: root },
    ]);
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
