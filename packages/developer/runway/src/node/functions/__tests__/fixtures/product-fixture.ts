/**
 * Stackra file contract:
 * Purpose: `writeLines(dir)` and `writeProduct(dir, runway, packages)`, the product build tests' fixtures: a local
 *          checkout of three generic lines (`os/console@3`, `os/landing@1`, `os/mobile@3` as `@example/os-*`, with a
 *          built shell's `dist/shell.json` and import map, and a mobile template's `app.json`, capability catalogue and
 *          product module), and a product repository (its root runway, landing seed and packages with their entries).
 * Boundary: test only; writes under the folder it is given.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0481.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Writes `value` (JSON unless a string) at `file`, making its folder. */
export function put(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
}

/** The shared modules every fixture shell maps. */
const IMPORTS = {
  react: "assets/react.js",
  "react/jsx-runtime": "assets/jsx.js",
  "@stackra/ui/react": "assets/ui.js",
};

/** Writes the three lines under `dir/apps`. */
export function writeLines(dir: string): void {
  for (const [name, version] of [
    ["console", "3.0.0"],
    ["landing", "1.0.0"],
  ] as const) {
    const app = join(dir, "apps", name);
    put(join(app, "package.json"), { name: `@example/os-${name}`, version });
    put(join(app, "dist/import-map.json"), { imports: IMPORTS });
    put(join(app, "dist/shell.json"), {
      surface: name,
      line: version.split(".")[0],
      version,
      entry: "assets/main.js",
      css: [],
      importMap: { imports: IMPORTS },
    });
  }
  const mobile = join(dir, "apps", "mobile");
  put(join(mobile, "package.json"), {
    name: "@example/os-mobile",
    version: "3.0.0",
    dependencies: {},
  });
  put(join(mobile, "app.json"), {
    expo: { name: "Template", slug: "template", plugins: [], extra: {} },
  });
  put(join(mobile, "src/products/product-modules.ts"), "export const PRODUCT_MODULES = [];\n");
  put(join(mobile, "capabilities.json"), {
    push: { modules: ["expo-notifications"], plugins: ["expo-notifications"] },
    camera: {
      modules: ["expo-camera"],
      plugins: ["expo-camera"],
      android: { permissions: ["android.permission.CAMERA"] },
    },
    scanner: {
      modules: ["expo-camera"],
      plugins: ["expo-camera"],
      android: { permissions: ["android.permission.CAMERA"] },
    },
    kiosk: {},
    bluetooth: {
      plugins: ["./plugins/bluetooth.plugin.js"],
      android: { permissions: ["android.permission.BLUETOOTH_SCAN"] },
    },
    "tap-to-pay": {
      modules: ["@stackra/native-card-terminal"],
      plugins: ["@stackra/native-card-terminal"],
    },
    location: {
      modules: ["expo-location"],
      android: { permissions: ["android.permission.ACCESS_FINE_LOCATION"] },
    },
  });
}

/** Writes a product repository: its root runway, a landing seed and each package with the exports it names. */
export function writeProduct(
  dir: string,
  runway: string,
  packages: Readonly<Record<string, readonly ("console" | "portal" | "landing" | "native")[]>>,
): void {
  put(join(dir, "runway.yaml"), runway);
  put(join(dir, "assets/landing/index.json"), { block: "example.hero", props: { title: "Hi" } });
  for (const [index, [name, entries]] of Object.entries(packages).entries()) {
    // Each surface key is an export: a portal (a console preset) loads `./portal`.
    const folder = join(dir, "packages", "application", `p${index}`);
    put(join(folder, "package.json"), {
      name,
      version: "0.2.0",
      exports: Object.fromEntries(
        entries.map((entry) => [
          `./${entry}`,
          { "@stackra/source": `./src/${entry}.ts`, default: `./dist/${entry}.mjs` },
        ]),
      ),
    });
    for (const entry of entries)
      put(join(folder, "src", `${entry}.ts`), "export function register(): void {}\n");
  }
}

/** The template PR's root runway, trimmed to what the product build reads. */
export const TEMPLATE_RUNWAY = `version: 3
project: acme-platform
product:
  key: acme
surfaces:
  console:
    shell: os/console@3
    packages: ["@figentra/acme-example"]
    host: console.acme
  landing:
    shell: os/landing@1
    packages: ["@figentra/acme-example"]
    content: assets/landing
    host: acme
mobile:
  app:
    template: os/mobile@3
    packages: ["@figentra/acme-example"]
    identity:
      name: { en: Acme }
      ios: { bundleId: com.acme.app }
      android: { package: com.acme.app }
      scheme: acme
    capabilities: [push]
    eas: { channel: production }
environments:
  production:
    regions: [me-central-1]
    domains: { zone: figentra.com }
    deploy: { on: promote, approval: github-environment }
`;

/** academorix's root runway in the shape of the products' go-live PRs: the portal a console preset, hosts on v2. */
export const ACADEMORIX_RUNWAY = (capabilities: string) => `version: 3
project: academorix
product:
  key: academorix
surfaces:
  console:
    shell: os/console@3
    packages: ["@figentra/academorix-console-ui", "@figentra/academorix-studio-board"]
    host: console.v2.academorix
  portal:
    shell: os/console@3
    preset: portal
    packages: ["@figentra/academorix-family-ui"]
    host: family.v2.academorix
  landing:
    shell: os/landing@1
    content: assets/landing
    packages: ["@figentra/academorix-landing-blocks"]
    host: v2.academorix
mobile:
  academorix:
    template: os/mobile@3
    packages: ["@figentra/academorix-family-ui", "@figentra/academorix-staff-ui", "@figentra/academorix-studio-board"]
    identity:
      name: { en: Academorix }
      ios: { bundleId: app.academorix.mobile }
      android: { package: app.academorix.mobile }
      scheme: academorix
    tablet: true
    capabilities: [${capabilities}]
    stores: { apple: { account: figentra }, google: { account: figentra } }
    eas: { channel: production }
environments:
  production:
    regions: [me-central-1]
    domains: { zone: figentra.com }
`;

/** academorix's packages and the entries each exports. */
export const ACADEMORIX_PACKAGES = {
  "@figentra/academorix-console-ui": ["console"],
  "@figentra/academorix-studio-board": ["console", "native"],
  "@figentra/academorix-family-ui": ["portal", "native"],
  "@figentra/academorix-landing-blocks": ["landing"],
  "@figentra/academorix-staff-ui": ["native"],
} as const;
