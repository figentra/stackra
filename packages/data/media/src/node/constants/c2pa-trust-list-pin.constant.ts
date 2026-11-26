/**
 * Stackra file contract:
 * Purpose: `C2PA_TRUST_LIST_PIN`, where the pinned copy of the C2PA trust list (`C2PA_TRUST_LIST`) came from: the
 *          upstream file at a `c2pa-org/conformance-public` commit, and that file's SHA-256.
 * Boundary: data only. Updated in the same pull request as `C2PA_TRUST_LIST`, never on its own; the test checks the
 *           list's SHA-256 against this one.
 * Runtime: node
 * Governing contract: STA-2791 (CTO decision of 2026-11-25: the pinned C2PA trust list, updated by PR).
 */

/** Where the pinned copy came from, and its SHA-256, to check it against upstream (`curl -fsSL <source> | sha256sum`). */
export const C2PA_TRUST_LIST_PIN = {
  /** The upstream file at the pinned commit. */
  source:
    "https://raw.githubusercontent.com/c2pa-org/conformance-public/c68494b5954bcd19ec528d092377665ae9f62879/trust-list/C2PA-TRUST-LIST.pem",
  /** The `c2pa-org/conformance-public` commit: its trust-list sync of 2026-11-26. */
  commit: "c68494b5954bcd19ec528d092377665ae9f62879",
  /** The SHA-256 of the file's UTF-8 bytes, hex. */
  sha256: "62673a9e68e30f953eda65b4171e980ee111e1f12385989b1230fdfe787bfae8",
} as const;
