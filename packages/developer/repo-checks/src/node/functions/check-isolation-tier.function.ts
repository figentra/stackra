/**
 * Stackra file contract:
 * Purpose: `checkIsolationTier(path, text)`, ADR 0239 decision 1: a test that asserts row-level security runs in the
 *          integration tier (`.int.test.`). PGlite, the memory database driver and the Testcontainers superuser all
 *          bypass row-level security, so the same assertion in a unit test passes whatever the policies say.
 * Boundary: pure, text only. A row-security test is one that imports `assertRowSecurity` or `tenantIsolationOptions`
 *           from `@stackra/database/testing` or `@stackra/tenancy/testing` in a top-level import; the helpers' own
 *           unit tests import them by `#` subpath, and a generator's test that holds the import in a string literal
 *           is not an import. `.old/` is archived code.
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1); ADR 0182 (integration tier); ADR 0022 (test names).
 */
import { TEST_FILE_PATTERN } from "#node/constants/test-file-pattern.constant";

/** A top-level import of a row-security helper from its published testing entry. */
const IMPORTS_ROW_SECURITY_HELPER =
  /^import\s*\{[^}]*\b(?:assertRowSecurity|tenantIsolationOptions)\b[^}]*\}\s*from\s*["']@stackra\/(?:database|tenancy)\/testing["']/m;

/**
 * The isolation-tier finding of one file: a unit-tier test that asserts row-level security.
 *
 * @param path - repository-relative, used in the finding.
 * @param text - the file's contents.
 * @example
 * checkIsolationTier("services/x/src/__tests__/isolation.test.ts", source); // one finding when it imports assertRowSecurity
 */
export function checkIsolationTier(path: string, text: string): string[] {
  if (path.startsWith(".old/") || !TEST_FILE_PATTERN.test(path) || /\.int\.test\./.test(path))
    return [];
  if (!IMPORTS_ROW_SECURITY_HELPER.test(text)) return [];
  return [
    `${path}: a row-level security test runs on Postgres in test:int: name it <subject>.int.test.ts; PGlite, the memory driver and the container superuser bypass RLS, so this unit test proves nothing (ADR 0239)`,
  ];
}
