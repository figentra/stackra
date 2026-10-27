/**
 * Stackra file contract:
 * Purpose: `verifyLicenceFile`, the offline verifier: takes a Keygen licence file (`-----BEGIN LICENSE FILE-----`),
 *          checks its Ed25519 signature over `license/<enc>` with the account's verify key, decrypts it when it is
 *          `aes-256-gcm+ed25519`, and returns the `Licence` it states.
 * Boundary: no network, no clock and no state: the install verifies its licence without calling home (ADR 0178
 *           decision 5). Expiry is not judged here; `licenceStanding` does that. A file it cannot trust refuses with
 *           `LicenceFileInvalidError`; a verify key that is not 64 hex characters is a configuration bug (RangeError).
 *           Built on Web Crypto (`crypto.subtle`, Ed25519 and AES-GCM), so it runs in Node, browsers and workers.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1, 2, 5 and 6); ADR 0076 (on-prem and air-gapped);
 *                     stackra-224 (decodeBase64 and isRecord from @stackra/support).
 */
import { decodeBase64, isRecord } from "@stackra/support";

import { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
import { decryptLicence } from "#core/functions/decrypt-licence.function";
import { readLicence } from "#core/functions/read-licence.function";
import type { Licence } from "#core/types/licence.type";
import type { LicenceFileOptions } from "#core/types/licence-file-options.type";

/** The armoured body between Keygen's markers. */
const ARMOUR = /-----BEGIN LICENSE FILE-----([\s\S]+?)-----END LICENSE FILE-----/;

/** The verify key as Keygen shows it: 32 bytes in hex. */
const VERIFY_KEY = /^[0-9a-f]{64}$/i;

/** Parses JSON, or refuses the file as malformed. */
function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch (error) {
    throw LicenceFileInvalidError.create({ reason: "malformed" }, { cause: error });
  }
}

/** Base64 to bytes, or refuses the file as malformed. */
function bytesOf(text: string): Uint8Array<ArrayBuffer> {
  const bytes = decodeBase64(text);
  if (bytes === undefined) throw LicenceFileInvalidError.create({ reason: "malformed" });
  return bytes;
}

/**
 * Verifies a licence file and reads it.
 *
 * @example
 * const licence = await verifyLicenceFile(await readFile("/etc/stackra/licence.lic", "utf8"), {
 *   publicKey: KEYGEN_VERIFY_KEY,
 *   licenceKey, // only for an encrypted file
 * });
 * licenceStanding(licence, Duration.days(14)); // "active", "grace" or "read_only"
 * @throws LicenceFileInvalidError when the file is malformed, its algorithm unknown, its signature wrong, or it
 *         cannot be decrypted.
 * @throws RangeError when `publicKey` is not 64 hex characters.
 */
export async function verifyLicenceFile(
  file: string,
  options: LicenceFileOptions,
): Promise<Licence> {
  if (!VERIFY_KEY.test(options.publicKey))
    throw new RangeError("publicKey must be the Keygen Ed25519 verify key, 64 hex characters");
  const keyBytes = Uint8Array.from(options.publicKey.match(/../g) ?? [], (pair) =>
    Number.parseInt(pair, 16),
  );
  const verifyKey = await crypto.subtle.importKey("raw", keyBytes, "Ed25519", false, ["verify"]);

  const armour = ARMOUR.exec(file)?.[1];
  if (armour === undefined) throw LicenceFileInvalidError.create({ reason: "malformed" });
  const certificate = parseJson(bytesOf(armour));
  if (
    !isRecord(certificate) ||
    typeof certificate.enc !== "string" ||
    typeof certificate.sig !== "string" ||
    typeof certificate.alg !== "string"
  )
    throw LicenceFileInvalidError.create({ reason: "malformed" });
  const { enc, sig, alg } = certificate;
  if (alg !== "base64+ed25519" && alg !== "aes-256-gcm+ed25519")
    throw LicenceFileInvalidError.create({ reason: "unsupported_algorithm" });

  const signed = await crypto.subtle.verify(
    "Ed25519",
    verifyKey,
    bytesOf(sig),
    new TextEncoder().encode(`license/${enc}`),
  );
  if (!signed) throw LicenceFileInvalidError.create({ reason: "bad_signature" });

  const plaintext =
    alg === "base64+ed25519" ? bytesOf(enc) : await decryptLicence(enc, options.licenceKey);
  return readLicence(parseJson(plaintext));
}
