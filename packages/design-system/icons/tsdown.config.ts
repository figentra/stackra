/**
 * Stackra file contract:
 * Purpose: build config of @stackra/icons: one tsdown entry per package.json export (core `.` is `index`). The
 *          entries name stand-in barrels until gen writes the entry barrels (ADR 0294 decision 15, STA-339). The icon
 *          libraries, React and React Native are optional peers and stay external, so a registry bundles only what
 *          it imports.
 * Boundary: build configuration only; spreads gen's `./.stackra/tsdown.config` and lays this package's own entries
 *           (the barrels package.json `exports` names) and options over it, so gen keeps this file (ADR 0295
 *           decision 5; STA-1306, STA-1299). Before gen has run the package's own config builds alone.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators); ADR 0303 (decision 10).
 */
import { existsSync } from "node:fs";

import { library } from "@stackra/tsdown-config";

// `.stackra/` exists only after `stackra gen`, and `build` does not wait for gen (the CLI that runs gen builds first).
// A runtime URL, so a config bundler never tries to resolve the file before gen has written it.
const url = new URL("./.stackra/tsdown.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : {};

export default {
  ...generated,
  ...library(
    {
      index: "src/core/index.ts",
      contracts: "src/contracts/index.ts",
      node: "src/node/icons.module.ts",
      react: "src/react/index.ts",
      "react-lucide-icons": "src/react/lucide-icons/lucide-icons.ts",
      "react-lucide-registry": "src/react/lucide-registry/lucide-registry.ts",
      native: "src/native/index.ts",
      "native-lucide-icons": "src/native/lucide-icons/lucide-icons.ts",
      "native-lucide-registry": "src/native/lucide-registry/lucide-registry.ts",
    },
    { decorators: true },
  ),
};
