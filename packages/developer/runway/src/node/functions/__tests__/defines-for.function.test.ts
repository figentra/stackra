/**
 * Stackra file contract:
 * Purpose: unit tests of `definesFor`: in dev, the public vars as `import.meta.env.<NAME>` JSON (literals as written,
 *          `from-port` as the member's own origin, `from-port: gateway` and `from-member` with scheme and path from
 *          the dev facts), server vars left out, and `__STACKRA_RUNWAY__` holding the member's dev facts without the
 *          TLS paths; outside dev, `ref:` and `${pr}` values from the build environment and the desktop feed from the
 *          root origin, member feed path and environment channel; and the failures for an unknown environment, an
 *          unset deploy-time value, a dev reference outside dev and a channel without a root feed origin.
 * Boundary: test only; writes a throwaway repository (root and member runways, dev facts) in the OS temp directory and
 *           points `process.cwd()` at the member.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1); ADR 0231 (decision 4); ADR 0254.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { definesFor } from "#node/functions/defines-for.function";

const ROOT_RUNWAY = [
  "version: 3",
  "project: acme-platform",
  "environments:",
  "  dev:",
  "    topology:",
  "      mode: monolith",
  "targets:",
  "  electron-release:",
  "    feed:",
  "      publicOrigin: https://downloads.acme.example",
];

const CONSOLE_RUNWAY = [
  "version: 3",
  "release:",
  "  desktop:",
  "    channels: [beta, latest]",
  "    feedPath: console",
  "environments:",
  "  dev:",
  "    port: 5173",
  "    vars:",
  '      VITE_SENTRY_DSN: ""',
  "      VITE_SAMPLE_RATE: 1",
  "      VITE_SELF_ORIGIN: from-port",
  "      EXPO_PUBLIC_API_ORIGIN:",
  "        from-port: gateway",
  "      EXPO_PUBLIC_REALTIME_ORIGIN:",
  "        from-port: gateway",
  "        scheme: ws",
  "        path: /realtime",
  "      RENDERER_VITE_APP_ORIGIN:",
  "        from-member: web",
  "      STACKRA_SITE_URL: from-port",
  "  preview:",
  "    vars:",
  '      VITE_API_ORIGIN: "https://api-pr-${pr}.preview.acme.example"',
  "  staging:",
  "    vars:",
  "      VITE_API_ORIGIN:",
  "        from-port: gateway",
  "  production:",
  "    vars:",
  "      VITE_API_ORIGIN: https://api.acme.example",
  "      VITE_SENTRY_DSN: ref:sentry.dsn.console",
  "    desktop:",
  "      channel: latest",
];

const DEV_FACTS = {
  version: 1,
  lane: 1,
  infra: { gateway: { port: 4100, url: "http://localhost:4100" } },
  members: {
    console: {
      url: "http://localhost:5273",
      port: 5273,
      host: "localhost",
      tls: { cert: "/home/dev/cert.pem", key: "/home/dev/key.pem" },
      desktop: { remoteDebugPort: 9322 },
    },
    web: { url: "https://web.localhost:5275", port: 5275, host: "web.localhost" },
  },
};

let repository: string;

/** Writes a file of the throwaway repository from lines. */
function write(path: string, content: string): void {
  mkdirSync(join(repository, path, ".."), { recursive: true });
  writeFileSync(join(repository, path), content);
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-"));
  write("pnpm-workspace.yaml", "packages: [apps/*]\n");
  write("runway.yaml", `${ROOT_RUNWAY.join("\n")}\n`);
  write("apps/console/runway.yaml", `${CONSOLE_RUNWAY.join("\n")}\n`);
  vi.spyOn(process, "cwd").mockReturnValue(join(repository, "apps", "console"));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(repository, { recursive: true, force: true });
});

describe("definesFor", () => {
  it("resolves the public dev vars and injects the member's dev facts", () => {
    write(".stackra/dev/ports.json", JSON.stringify(DEV_FACTS));

    const defines = definesFor("console", "dev");

    expect(defines).toEqual({
      "import.meta.env.VITE_SENTRY_DSN": '""',
      "import.meta.env.VITE_SAMPLE_RATE": '"1"',
      "import.meta.env.VITE_SELF_ORIGIN": '"http://localhost:5273"',
      "import.meta.env.EXPO_PUBLIC_API_ORIGIN": '"http://localhost:4100"',
      "import.meta.env.EXPO_PUBLIC_REALTIME_ORIGIN": '"ws://localhost:4100/realtime"',
      "import.meta.env.RENDERER_VITE_APP_ORIGIN": '"https://web.localhost:5275"',
      __STACKRA_RUNWAY__: expect.any(String),
    });
    const injected = JSON.parse(defines["__STACKRA_RUNWAY__"] ?? "");
    expect(injected).toEqual({
      version: 1,
      environment: "dev",
      lane: 1,
      members: {
        console: {
          url: "http://localhost:5273",
          port: 5273,
          host: "localhost",
          https: false,
          open: false,
          desktop: { remoteDebugPort: 9322 },
        },
      },
    });
    expect(defines["__STACKRA_RUNWAY__"]).not.toContain("cert.pem");
  });

  it("injects no facts in dev when stackra dev has not run and no value needs them", () => {
    write(
      "apps/console/runway.yaml",
      'version: 3\nenvironments:\n  dev:\n    vars:\n      VITE_SENTRY_DSN: ""\n',
    );

    expect(definesFor("console", "dev")).toEqual({ "import.meta.env.VITE_SENTRY_DSN": '""' });
  });

  it("returns only the facts for a member without a runway file", () => {
    vi.spyOn(process, "cwd").mockReturnValue(join(repository, "apps", "docs"));
    mkdirSync(join(repository, "apps", "docs"), { recursive: true });

    expect(definesFor("docs", "staging")).toEqual({
      __STACKRA_RUNWAY__: JSON.stringify({
        version: 1,
        environment: "staging",
        members: { docs: {} },
      }),
    });
  });

  it("reads deploy-time values from the build environment and injects the desktop feed", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@sentry.example/1");

    const defines = definesFor("console", "production");

    expect(defines["import.meta.env.VITE_API_ORIGIN"]).toBe('"https://api.acme.example"');
    expect(defines["import.meta.env.VITE_SENTRY_DSN"]).toBe('"https://public@sentry.example/1"');
    expect(JSON.parse(defines["__STACKRA_RUNWAY__"] ?? "")).toEqual({
      version: 1,
      environment: "production",
      feedOrigin: "https://downloads.acme.example",
      members: { console: { feed: { path: "console", channel: "latest" } } },
    });
  });

  it("fails for an unset deploy-time value, naming the variable", () => {
    vi.stubEnv("VITE_API_ORIGIN", undefined);

    expect(() => definesFor("console", "preview")).toThrow(RunwayUnresolvedError);
    expect(() => definesFor("console", "preview")).toThrow(/VITE_API_ORIGIN is resolved at deploy/);
  });

  it("fails for a dev reference outside dev and for an unknown environment", () => {
    expect(() => definesFor("console", "staging")).toThrow(/has no value in staging/);
    expect(() => definesFor("console", "prod")).toThrow(RangeError);
  });

  it("fails for a desktop channel without a root feed origin", () => {
    write("runway.yaml", `${ROOT_RUNWAY.slice(0, 6).join("\n")}\n`);
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@sentry.example/1");

    expect(() => definesFor("console", "production")).toThrow(/feed\.publicOrigin/);
  });
});
