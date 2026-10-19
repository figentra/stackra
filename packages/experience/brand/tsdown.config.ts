/**
 * Stackra file contract:
 * Purpose: build config of @stackra/brand — the single `src/index.ts` entry. Workspace consumers read the
 *          source through `exports`; dist exists only for publishing.
 * Owner: the package owner · Secrets: forbidden
 */
import { library } from "@stackra/tsdown-config";

export default library();
