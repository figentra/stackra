/**
 * Stackra file contract:
 * Purpose: `LINE_CHECKOUT_SETTINGS`, the data a template line checkout runs with: the folder a packed npm tarball
 *          unpacks from, the folders a local checkout never copies, the shell manifest's path in a shell release,
 *          the asset store path shells are served under, and the commit identity of a git checkout.
 * Boundary: data only; `checkoutLine` and `shellReleaseOf` read it.
 * Runtime: node
 * Governing contract: ADR 0481.
 */

/** How a line release is fetched, unpacked and read. */
export const LINE_CHECKOUT_SETTINGS = Object.freeze({
  /** The top folder of every tarball `npm pack` writes. */
  tarballRoot: "package",
  /** Folders a local checkout leaves out: installs, caches and native projects that prebuild writes. */
  localIgnore: Object.freeze([
    "node_modules",
    ".turbo",
    ".expo",
    ".stackra",
    "coverage",
    "ios",
    "android",
  ]),
  /** A built shell's manifest, relative to the release folder. */
  shellManifest: "dist/shell.json",
  /** The built shell's files, relative to the release folder; the asset store serves this folder. */
  shellDist: "dist",
  /** The asset store path of a shell release: `<origin>/<shellPath>/<surface>/<major>/<version>/`. */
  shellPath: "shells",
  /** The author of a git checkout's one commit; never pushed anywhere. */
  gitIdentity: Object.freeze(["-c", "user.name=runway", "-c", "user.email=runway@stackra.invalid"]),
} as const);
