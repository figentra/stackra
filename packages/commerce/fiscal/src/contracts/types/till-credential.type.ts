/**
 * Stackra file contract:
 * Purpose: `TillCredential`, the fiscal credential of one unit: its stage, the authority's request id, the token and
 *          secret the authority issued, its certificate and serial, and the mandate's other registration facts.
 * Boundary: a type only; kept by the host's `TillCredentials` store, which encrypts the secret and the attributes at
 *           rest. The package passes the issued values to the store once and never logs or returns them.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */

/** A unit's credential; fields the mandate does not use are `null`. */
export type TillCredential = {
  /** The till or invoicing unit. */
  readonly unitId: string;
  /** `compliance` while the unit is being checked, `production` once it may issue. */
  readonly stage: "compliance" | "production";
  /** The authority's request id for this credential. */
  readonly requestId: string | null;
  /** The issued security token (the certificate, base64). */
  readonly token: string | null;
  /** The issued secret paired with the token. */
  readonly secret: string | null;
  /** The signing certificate, base64 DER. */
  readonly certificate: string | null;
  /** The signing certificate's serial as the mandate prints it. */
  readonly certificateSerial: string | null;
  /**
   * Registration facts the mandate needs beside the token and secret, by snake_case key (an ETA POS's serial, OS
   * version and pre-shared key); absent when the mandate has none.
   */
  readonly attributes?: Readonly<Record<string, string>>;
};
