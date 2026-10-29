/**
 * Stackra file contract:
 * Purpose: hold `app-native-deps.mjs` to its contract: an Expo app missing a native library that a workspace package
 *          in its closure (dependencies and peerDependencies, recursively) declares is reported with the package that
 *          needs it; an app that declares them all, and a web app without `expo`, report nothing.
 * Boundary: writes fixture workspaces into temp directories; reads nothing of this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-1544.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { appNativeDependencyFindings, isNativeLibrary } from "../app-native-deps.mjs";

/** A temp workspace with a package.json per entry of `manifests`. */
function workspace(manifests) {
  const root = mkdtempSync(join(tmpdir(), "app-native-deps-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*/*\n");
  for (const [dir, manifest] of Object.entries(manifests)) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, "package.json"), JSON.stringify(manifest));
  }
  return root;
}

const PACKAGES = {
  "packages/data/storage": {
    name: "@stackra/storage",
    dependencies: { "react-native-mmkv": "catalog:mobile", zod: "catalog:" },
  },
  "packages/state/platform": {
    name: "@stackra/platform",
    peerDependencies: { "@stackra/storage": "workspace:*", "expo-widgets": "catalog:mobile" },
  },
};

test("an Expo app missing a native library of a package in its closure is reported with that package", () => {
  const root = workspace({
    ...PACKAGES,
    "apps/mobile": {
      name: "@figentra/mobile",
      dependencies: { expo: "catalog:mobile", "@stackra/platform": "workspace:*" },
    },
  });
  assert.deepEqual(
    appNativeDependencyFindings(root).map((finding) => [finding.dir, finding.text.split(":")[0]]),
    [
      ["apps/mobile", "missing native dependency expo-widgets (needed by @stackra/platform)"],
      ["apps/mobile", "missing native dependency react-native-mmkv (needed by @stackra/storage)"],
    ],
  );
});

test("an Expo app declaring every native library, and a web app, report nothing", () => {
  const root = workspace({
    ...PACKAGES,
    "apps/mobile": {
      name: "@figentra/mobile",
      dependencies: {
        expo: "catalog:mobile",
        "@stackra/platform": "workspace:*",
        "expo-widgets": "catalog:mobile",
        "react-native-mmkv": "catalog:mobile",
      },
    },
    "apps/playground": {
      name: "@figentra/playground",
      dependencies: { "@stackra/platform": "workspace:*" },
    },
  });
  assert.deepEqual(appNativeDependencyFindings(root), []);
});

test("native library names follow the autolinked prefixes", () => {
  assert.equal(isNativeLibrary("@react-native-community/netinfo"), true);
  assert.equal(isNativeLibrary("@shopify/react-native-skia"), true);
  assert.equal(isNativeLibrary("@expo/ui"), true);
  assert.equal(isNativeLibrary("react-native"), false);
  assert.equal(isNativeLibrary("zod"), false);
});
