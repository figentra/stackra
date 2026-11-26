/**
 * Stackra file contract:
 * Purpose: `DEV_ISSUER_FILE`, where `stackra dev` keeps a workspace's dev sign-in (STA-2795): the dev issuer's key
 *          pair and the seeded dev user, relative to the workspace root.
 * Boundary: data only. The `.stackra/` ignore in `.gitignore` keeps it out of git; the file is mode 600. It holds a
 *           private key that signs dev tokens, which only a service run by `stackra dev` accepts.
 * Runtime: node
 * Governing contract: ADR 0206 (amendment of 2026-11-26: the dev issuer); STA-2795.
 */

/** The dev sign-in of a workspace. */
export const DEV_ISSUER_FILE = ".stackra/dev-issuer.json";
