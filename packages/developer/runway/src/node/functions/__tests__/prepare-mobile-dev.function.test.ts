/**
 * Stackra file contract:
 * Purpose: unit tests of `prepareMobileDev`, the local mobile run's checkout: the template line is copied into the app's folder (replaced on
 *          every run), `app.json` gets the config the runway's identity and capabilities give it, the capabilities the app leaves off
 *          are excluded from Expo's autolinking, the product packages' `./native` entries are listed for the shell and their folders
 *          written for Metro, and `node_modules` is linked; an app the runway lacks, a package outside the workspace or without a
 *          `./native` export, and a capability the line does not offer are refused with their runway paths.
 * Boundary: test only; temporary folders and the generic `os/mobile@3` line of the product fixture, checked out from a local folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436; ADR 0441.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { prepareMobileDev } from "#node/functions/prepare-mobile-dev.function";

import { TEMPLATE_RUNWAY, writeLines, writeProduct } from "./fixtures/product-fixture";

let work: string;
let os: string;
let product: string;
let nodeModules: string;

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "stackra-mobile-dev-"));
  os = join(work, "os");
  product = join(work, "product");
  nodeModules = join(work, "installed", "node_modules");
  writeLines(os);
  mkdirSync(nodeModules, { recursive: true });
});

afterEach(() => rmSync(work, { recursive: true, force: true }));

/** The request for the fixture's `app`, checked out from the local `os/mobile` line. */
const request = (extra: Record<string, unknown> = {}) => ({
  repository: product,
  app: "app",
  line: { scope: "@example", local: join(os, "apps", "mobile") },
  nodeModules,
  ...extra,
});

const json = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;

describe("prepareMobileDev", () => {
  it("checks the template out into the app folder and writes its config, modules, roots and node_modules link", async () => {
    writeProduct(product, TEMPLATE_RUNWAY, { "@figentra/acme-example": ["console", "native"] });
    const dev = await prepareMobileDev(request());

    const dir = join(product, ".stackra", "mobile", "app");
    expect(dev.dir).toBe(dir);
    expect(dev.template).toMatchObject({ from: "local", package: "@example/os-mobile" });
    const entry = join(product, "packages", "application", "p0", "src", "native.ts");
    expect(dev.entries).toEqual([entry]);

    // app.json: the runway's identity and the enabled capability's plugin, in the `expo` block it returned.
    const expo = json(join(dir, "app.json"))["expo"] as Record<string, unknown>;
    expect(expo).toEqual(dev.config);
    expect(JSON.stringify(expo)).toContain("com.acme.app");
    expect(JSON.stringify(expo)).toContain("expo-notifications");

    // Autolinking leaves out what the app does not turn on, and keeps what it does.
    const autolinking = (
      json(join(dir, "package.json"))["expo"] as { autolinking: { exclude: string[] } }
    ).autolinking;
    expect(autolinking.exclude).toContain("expo-camera");
    expect(autolinking.exclude).not.toContain("expo-notifications");

    const modules = readFileSync(join(dir, "src/products/product-modules.ts"), "utf8");
    expect(modules).toContain(`import * as p0 from ${JSON.stringify(entry)};`);
    expect(modules).toContain("export const PRODUCT_MODULES");
    expect(modules).toContain("= [p0];");
    expect(json(join(dir, "products.json"))).toEqual({
      roots: [resolve(product, "packages/application/p0")],
    });

    const link = join(dir, "node_modules");
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(resolve(dir, readlinkSync(link))).toBe(resolve(nodeModules));
  });

  it("replaces the previous checkout on every run and honours `into`", async () => {
    writeProduct(product, TEMPLATE_RUNWAY, { "@figentra/acme-example": ["native"] });
    const into = join(work, "elsewhere", "checkout");
    mkdirSync(into, { recursive: true });
    writeFileSync(join(into, "stale.txt"), "left by the last run");
    const dev = await prepareMobileDev(request({ into }));
    expect(dev.dir).toBe(into);
    expect(existsSync(join(into, "stale.txt"))).toBe(false);
    expect(existsSync(join(into, "app.json"))).toBe(true);
    expect(existsSync(join(product, ".stackra"))).toBe(false);
  });

  it("refuses an app the root runway does not declare", async () => {
    writeProduct(product, TEMPLATE_RUNWAY, { "@figentra/acme-example": ["native"] });
    const refused = await prepareMobileDev(request({ app: "kiosk" })).catch(
      (error: unknown) => error,
    );
    expect(refused).toBeInstanceOf(RunwayInvalidError);
    expect(JSON.stringify((refused as RunwayInvalidError).issues)).toContain(
      "No such mobile app in the root runway",
    );
    expect(JSON.stringify((refused as RunwayInvalidError).issues)).toContain("mobile.kiosk");
  });

  it("refuses a package that is not in the workspace and one without a ./native export, each at its runway path", async () => {
    writeProduct(
      product,
      TEMPLATE_RUNWAY.replace(
        'packages: ["@figentra/acme-example"]\n    identity',
        'packages: ["@figentra/acme-example", "@figentra/missing"]\n    identity',
      ),
      {
        "@figentra/acme-example": ["console"],
      },
    );
    const refused = await prepareMobileDev(request()).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(RunwayInvalidError);
    const issues = JSON.stringify((refused as RunwayInvalidError).issues);
    expect(issues).toContain("@figentra/acme-example has no ./native export");
    expect(issues).toContain("mobile.app.packages.0");
    expect(issues).toContain("@figentra/missing is not a package under packages/");
    expect(issues).toContain("mobile.app.packages.1");
    // Nothing was checked out.
    expect(existsSync(join(product, ".stackra"))).toBe(false);
  });

  it("refuses a capability the template line does not offer", async () => {
    writeProduct(
      product,
      TEMPLATE_RUNWAY.replace("capabilities: [push]", "capabilities: [push, hologram]"),
      {
        "@figentra/acme-example": ["native"],
      },
    );
    const refused = await prepareMobileDev(request()).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(RunwayInvalidError);
    expect(JSON.stringify((refused as RunwayInvalidError).issues)).toContain(
      "The template line offers no capability hologram",
    );
  });
});
