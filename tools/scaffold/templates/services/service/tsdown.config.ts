/**
 * Stackra file contract:
 * Purpose: build config of @figentra/service-{{NAME}}: bundles the root module, legacy decorators on (ADR 0005). Gen
 *          writes the runtime entry that boots it (`.stackra/entry/server.ts`, ADR 0295), so no `main.ts` exists.
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0295 (decisions 5 and 7).
 */
import { library } from "@stackra/tsdown-config";

export default library({ module: "src/{{NAME}}.module.ts" }, { decorators: true });
