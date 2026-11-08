/**
 * Stackra file contract:
 * Purpose: `testPeerRequire(name)`, the `require` that finds a test-only peer: from this package first (its own tests
 *          install them), then from the member running the tests (its devDependencies), so `@stackra/database` need not
 *          declare them as peers. As optional peers they forked every dependent's install by whether a member had them
 *          (two variants of @stackra/integrations in a product with a pglite service and connectors without one).
 * Boundary: internal to `./testing`. A test runs with its member as the working directory, as vitest does.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: only the testing entry loads them); the peers-that-fork fix (2026-11-08).
 */
import { createRequire } from "node:module";
import { join } from "node:path";

/** `require` rooted at this package. */
const fromPackage = createRequire(import.meta.url);

/** Whether `error` is a module that is not installed. */
const notFound = (error: unknown): boolean => {
  const code = (error as { code?: string }).code;
  return code === "MODULE_NOT_FOUND" || code === "ERR_MODULE_NOT_FOUND";
};

/**
 * Loads `name` from this package, else from the member running the tests.
 * @throws the not-found error from the member when neither has it, or any other load error.
 * @example
 * const { PGlite } = testPeerRequire<typeof import("@electric-sql/pglite")>("@electric-sql/pglite");
 */
export function testPeerRequire<T>(name: string): T {
  try {
    return fromPackage(name) as T;
  } catch (error) {
    if (!notFound(error)) throw error;
    return createRequire(join(process.cwd(), "package.json"))(name) as T;
  }
}
