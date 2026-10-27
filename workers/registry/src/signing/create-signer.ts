/**
 * Stackra file contract:
 * Purpose: `createSigner`: the registry signer of a PKCS#8 PEM key.
 * Boundary: Web Crypto only; the private key comes from the REGISTRY_SIGNING_KEY secret (PKCS#8 PEM) and never leaves
 *           this module.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 9); npm registry signatures.
 */
import { fromBase64 } from "#src/bytes/from-base64";
import { toBase64 } from "#src/bytes/to-base64";
import type { Bytes } from "#src/interfaces/bytes.type";
import type { RegistryKey } from "#src/interfaces/registry-key.interface";
import type { RetiredKey } from "#src/interfaces/retired-key.interface";
import type { Signer } from "#src/interfaces/signer.interface";
import { keyIdOf } from "#src/signing/key-id-of";
import { p1363ToDer } from "#src/signing/p1363-to-der";

/** npm's key type and scheme for ECDSA P-256. */
const KEY_TYPE = "ecdsa-sha2-nistp256";

/** The DER bytes of a PEM block. */
function pemBody(pem: string): Bytes {
  return fromBase64(pem.replace(/-----(BEGIN|END) [A-Z ]+-----/g, "").replace(/\s+/g, ""));
}

/**
 * The registry signer of a PKCS#8 PEM key.
 *
 * @param pem - the REGISTRY_SIGNING_KEY secret.
 * @param expires - the current key's `expires`, or null.
 * @param retired - rotated keys that stay listed.
 * @example
 * const signer = await createSigner(env.REGISTRY_SIGNING_KEY, null, []);
 * await signer.sign("@stackra/core", "0.1.0", "sha512-…"); // { keyid: "SHA256:…", sig: "MEUCIQ…" }
 */
export async function createSigner(
  pem: string,
  expires: string | null,
  retired: readonly RetiredKey[],
): Promise<Signer> {
  const algorithm = { name: "ECDSA", namedCurve: "P-256" } as const;
  const privateKey = await crypto.subtle.importKey("pkcs8", pemBody(pem), algorithm, true, [
    "sign",
  ]);
  // The public half: the private JWK without `d` (and without `key_ops`, which says "sign").
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  delete jwk.d;
  delete jwk.key_ops;
  const publicKey = await crypto.subtle.importKey("jwk", jwk, algorithm, true, ["verify"]);
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", publicKey));
  const keyid = await keyIdOf(spki);
  const listed: RegistryKey[] = [
    { expires, keyid, keytype: KEY_TYPE, scheme: KEY_TYPE, key: toBase64(spki) },
    ...(await Promise.all(
      retired.map(async (old) => ({
        expires: old.expires,
        keyid: await keyIdOf(fromBase64(old.key)),
        keytype: KEY_TYPE,
        scheme: KEY_TYPE,
        key: old.key,
      })),
    )),
  ];
  return {
    async sign(name, version, integrity) {
      const message = new TextEncoder().encode(`${name}@${version}:${integrity}`);
      const raw = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, message);
      return { keyid, sig: toBase64(p1363ToDer(new Uint8Array(raw))) };
    },
    keys: () => listed,
  };
}
