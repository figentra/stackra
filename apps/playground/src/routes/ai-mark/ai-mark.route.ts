/**
 * Stackra file contract:
 * Purpose: the AI mark route of @figentra/playground: its path. The page it renders is
 *          `ai-mark.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-803.
 */
import { Route } from "@stackra/navigation";

/** The `@stackra/ui` AI mark page, at `/ai-mark`. */
export class AiMarkRoute extends Route({ path: "/ai-mark" }) {}
