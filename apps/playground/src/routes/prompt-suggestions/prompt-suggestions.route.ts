/**
 * Stackra file contract:
 * Purpose: the prompt suggestions route of @figentra/playground: its path. The page it renders is
 *          `prompt-suggestions.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The PromptSuggestions page, at `/prompt-suggestions`. */
export class PromptSuggestionsRoute extends Route({ path: "/prompt-suggestions" }) {}
