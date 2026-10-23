/**
 * Stackra file contract:
 * Purpose: build config of @stackra/icons: one tsdown entry per package.json export (core `.` is `index`). The
 *          entries name stand-in barrels until gen writes the entry barrels (ADR 0294 decision 15, STA-339). The icon
 *          libraries, React and React Native are optional peers and stay external, so a registry bundles only what
 *          it imports.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators); ADR 0303 (decision 10).
 */
import { library } from "@stackra/tsdown-config";

export default library(
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
);
