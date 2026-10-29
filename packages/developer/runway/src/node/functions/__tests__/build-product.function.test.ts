/**
 * Stackra file contract:
 * Purpose: the product build and deploy test set (`buildProduct`, `deployProduct`) on two products with no app members:
 *          the template PR's root runway and academorix's (three surfaces, a portal preset, one mobile app with three
 *          packages). A dry run plans the bundles, writes each app's config with only its capability flags and its
 *          packages built in, and records the EAS builds; a real build runs the bundler against the shell's import
 *          map and writes the bundle manifest; a flag the line does not offer is refused; the deploy publishes the
 *          built bundles and host rows, lists the landing seeds and submits the builds, and refuses a production deploy
 *          without its approval or an app without store accounts.
 * Boundary: test only; temporary folders, real git for the template checkouts, a fake bundler and fake EAS and wrangler.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436; ADR 0439; ADR 0441 (decision 3); ADR 0481.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { buildProduct } from "#node/functions/build-product.function";
import { deployProduct } from "#node/functions/deploy-product.function";
import { dryRunCommand } from "#node/functions/dry-run-command.function";
import { runCommand } from "#node/functions/run-command.function";
import type { SurfaceBundler } from "#node/types/surface-bundler.type";

import {
  ACADEMORIX_PACKAGES,
  ACADEMORIX_RUNWAY,
  put,
  TEMPLATE_RUNWAY,
  writeLines,
  writeProduct,
} from "./fixtures/product-fixture";

const SHA = "a".repeat(40);
let work: string;
let os: string;
let product: string;

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "stackra-product-"));
  os = join(work, "os");
  product = join(work, "product");
  writeLines(os);
});

afterEach(() => rmSync(work, { recursive: true, force: true }));

const read = (file: string) => JSON.parse(readFileSync(join(product, file), "utf8"));

/** A fake bundler that writes one entry chunk and answers it. */
const bundler: SurfaceBundler = async (job) => {
  put(join(job.outDir, `${job.surface}.js`), "export default () => {};\n");
  return {
    entry: `${job.surface}.js`,
    modulepreload: [],
    css: [],
    imports: Object.keys(job.importMap.imports),
  };
};

describe("buildProduct", () => {
  it("dry-runs the template: plans the bundles, writes the app config and records the EAS build", async () => {
    writeProduct(product, TEMPLATE_RUNWAY, {
      "@figentra/acme-example": ["console", "landing", "native"],
    });
    const build = await buildProduct({
      repository: product,
      scope: "@example",
      os,
      sha: SHA,
      dryRun: true,
    });

    expect(build.surfaces["console"]).toEqual({
      shell: {
        line: "os/console@3",
        package: "@example/os-console",
        version: "3.0.0",
        importMap: ["react", "react/jsx-runtime", "@stackra/ui/react"],
      },
      packages: ["@figentra/acme-example"],
      hosts: ["console.acme"],
      content: [],
    });
    expect(build.surfaces["landing"]?.content).toEqual(["assets/landing/index.json"]);
    expect(
      readFileSync(join(product, ".stackra/surfaces/console/bundle-entry.ts"), "utf8"),
    ).toContain("../../../packages/application/p0/src/console.ts");
    expect(existsSync(join(product, "dist/bundles"))).toBe(false);

    expect(build.mobile["app"]).toMatchObject({
      template: { line: "os/mobile@3", package: "@example/os-mobile", version: "3.0.0" },
      capabilities: ["push"],
      packages: { "@figentra/acme-example": "0.2.0" },
      buildIds: [],
    });
    const app = read(".stackra/mobile/app/app.json").expo;
    expect(app.extra.capabilities).toEqual(["push"]);
    expect(app.plugins).toEqual(["expo-notifications"]);
    expect(read(".stackra/mobile/app/package.json").dependencies).toEqual({
      "@figentra/acme-example": "0.2.0",
    });
    expect(
      readFileSync(join(product, ".stackra/mobile/app/src/products/product-modules.ts"), "utf8"),
    ).toContain('from "@figentra/acme-example/native"');
    expect(build.planned.map((step) => step.args[0])).toEqual(["build"]);
    expect(read("dist/product/build.json")).toEqual(structuredClone(build));
  });

  it("builds the template's bundles with the bundler and its app on EAS", async () => {
    writeProduct(product, TEMPLATE_RUNWAY, {
      "@figentra/acme-example": ["console", "landing", "native"],
    });
    const eas = dryRunCommand({
      answer: (command, args, cwd) =>
        command === "eas"
          ? JSON.stringify([{ id: "build-ios" }, { id: "build-android" }])
          : runCommand(command, args, { cwd }),
    });
    const build = await buildProduct({
      repository: product,
      scope: "@example",
      os,
      sha: SHA,
      bundle: bundler,
      run: eas,
    });
    expect(build.surfaces["console"]?.bundle).toEqual({
      package: "acme",
      surface: "console",
      targets: "console@3",
      version: SHA.slice(0, 12),
      entry: "console.js",
      modulepreload: [],
      css: [],
      imports: ["react", "react/jsx-runtime", "@stackra/ui/react"],
    });
    expect(read(`dist/bundles/console/${SHA.slice(0, 12)}/bundle.manifest.json`).targets).toBe(
      "console@3",
    );
    expect(build.surfaces["landing"]?.bundle?.targets).toBe("landing@1");
    expect(build.mobile["app"]?.buildIds).toEqual(["build-ios", "build-android"]);
  });

  it("refuses academorix's wallet flag, which the line does not offer", async () => {
    writeProduct(
      product,
      ACADEMORIX_RUNWAY("push, camera, scanner, wallet, kiosk, tap-to-pay, bluetooth"),
      ACADEMORIX_PACKAGES,
    );
    await expect(
      buildProduct({ repository: product, scope: "@example", os, sha: SHA, dryRun: true }),
    ).rejects.toThrow(/offers no capability wallet/);
  });

  it("dry-runs academorix: three surfaces, the portal preset, one app with three packages", async () => {
    writeProduct(
      product,
      ACADEMORIX_RUNWAY("push, camera, scanner, kiosk, tap-to-pay, bluetooth"),
      ACADEMORIX_PACKAGES,
    );
    const build = await buildProduct({
      repository: product,
      scope: "@example",
      os,
      sha: SHA,
      dryRun: true,
    });
    expect(Object.keys(build.surfaces)).toEqual(["console", "portal", "landing"]);
    expect(build.surfaces["portal"]).toMatchObject({
      shell: { line: "os/console@3", package: "@example/os-console" },
      preset: "portal",
      packages: ["@figentra/academorix-family-ui"],
      hosts: ["family.v2.academorix"],
    });
    expect(build.surfaces["console"]?.packages).toHaveLength(2);
    expect(Object.keys(build.mobile["academorix"]?.packages ?? {})).toHaveLength(3);
    const app = read(".stackra/mobile/academorix/app.json").expo;
    expect(app.extra.capabilities).toEqual([
      "push",
      "camera",
      "scanner",
      "kiosk",
      "tap-to-pay",
      "bluetooth",
    ]);
    expect(app.android.blockedPermissions).toEqual(["android.permission.ACCESS_FINE_LOCATION"]);
    expect(read(".stackra/mobile/academorix/package.json").expo.autolinking.exclude).toEqual([
      "expo-location",
    ]);
  });

  it("refuses a package without the surface's export", async () => {
    writeProduct(product, TEMPLATE_RUNWAY, { "@figentra/acme-example": ["console", "native"] });
    await expect(
      buildProduct({ repository: product, scope: "@example", os, sha: SHA, dryRun: true }),
    ).rejects.toThrow(RunwayInvalidError);
  });
});

/** Builds the template with fake EAS ids and the fake bundler. */
async function built(): Promise<void> {
  writeProduct(product, TEMPLATE_RUNWAY, {
    "@figentra/acme-example": ["console", "landing", "native"],
  });
  const eas = dryRunCommand({
    answer: (command, args, cwd) =>
      command === "eas"
        ? JSON.stringify([{ id: "build-ios" }])
        : runCommand(command, args, { cwd }),
  });
  await buildProduct({
    repository: product,
    scope: "@example",
    os,
    sha: SHA,
    bundle: bundler,
    run: eas,
  });
}

describe("deployProduct", () => {
  const STORES = {
    app: [
      { store: "app_store" as const, owner: "platform" as const, account: "figentra" },
      { store: "google_play" as const, owner: "platform" as const, account: "figentra" },
    ],
  };

  it("dry-runs a production deploy: bundles, host rows, release pointers, seeds and the submission", async () => {
    await built();
    const deploy = await deployProduct({
      repository: product,
      environment: "production",
      assets: { bucket: "assets", origin: "https://assets.example.test" },
      served: ["console@3", "landing@1"],
      firstRelease: true,
      stores: STORES,
      dryRun: true,
    });
    expect(deploy.surfaces.written).toEqual([
      "host:console.acme.figentra.com",
      "host:acme.figentra.com",
      "release:acme:console",
      "release:acme:landing",
    ]);
    expect(deploy.seeds).toEqual({ landing: ["assets/landing/index.json"] });
    expect(deploy.submitted).toEqual({ app: ["build-ios"] });
    expect(deploy.planned.map((step) => `${step.command} ${step.args[0]}`)).toEqual(
      expect.arrayContaining(["wrangler r2", "eas build:view", "eas submit"]),
    );
    expect(read("dist/product/deploy-production.json").sha).toBe(SHA);
  });

  it("refuses production without its approval, an app without store accounts, and a deploy before a build", async () => {
    const request = {
      repository: product,
      environment: "production" as const,
      assets: { bucket: "assets", origin: "https://assets.example.test" },
      served: ["console@3", "landing@1"],
      firstRelease: true,
    };
    writeProduct(product, TEMPLATE_RUNWAY, {});
    await expect(deployProduct({ ...request, dryRun: true })).rejects.toThrow(
      /stackra build --product/,
    );
    await built();
    await expect(deployProduct({ ...request, stores: STORES })).rejects.toThrow(
      RunwayUnresolvedError,
    );
    await expect(deployProduct({ ...request, approved: true, dryRun: true })).rejects.toThrow(
      /No account publishes/,
    );
  });
});
