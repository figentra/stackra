/**
 * Stackra file contract:
 * Purpose: `importOptionalPeer`, the import of a package this one lists as an optional peer: a member that uses the feature
 *          installs the package, every other member skips it. A package that is not installed is one error that says what to add;
 *          any other failure of the import (a package deeper in its tree, a syntax error) is the package's and passes on unchanged.
 * Boundary: loads what its caller's `load` loads; reads no file and no environment.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5).
 */

/**
 * The module `load` imports, or one error that says what to install when `name` is not there.
 *
 * @param load - the import of the peer, `() => import("<name>")`; a test passes one that fails as a missing package does.
 * @param name - the package name the peer is installed as.
 * @param instruction - the error message when it is not installed.
 * @example
 * const { VitePWA } = await importOptionalPeer(() => import("vite-plugin-pwa"), "vite-plugin-pwa", "add vite-plugin-pwa");
 */
export async function importOptionalPeer<Module>(
  load: () => Promise<Module>,
  name: string,
  instruction: string,
): Promise<Module> {
  try {
    return await load();
  } catch (error) {
    const { code, message } = error as { code?: string; message?: string };
    if (code === "ERR_MODULE_NOT_FOUND" && message?.includes(`'${name}'`))
      throw new Error(instruction, { cause: error });
    throw error;
  }
}
