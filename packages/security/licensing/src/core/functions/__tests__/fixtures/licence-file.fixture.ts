/**
 * Stackra file contract:
 * Purpose: test fixture: builds real Keygen-format licence files, signed with a fresh Ed25519 key and, when asked,
 *          sealed with AES-256-GCM under the SHA-256 of a licence key, exactly as Keygen issues them.
 * Boundary: test only; keys are generated per test run and never written anywhere.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0178.
 */

/** A signing key pair: the hex verify key the verifier takes and the private key that signs. */
export interface SigningKey {
  readonly publicKey: string;
  readonly privateKey: CryptoKey;
}

/** How to build one file. */
export interface LicenceFileShape {
  /** The dataset to sign; `keygenDataset()` when left out. */
  readonly dataset?: unknown;
  /** Seal the dataset under this licence key (`aes-256-gcm+ed25519`). */
  readonly licenceKey?: string;
  /** Write this algorithm instead of the one used. */
  readonly alg?: string;
  /** Change `enc` after signing, so the signature no longer matches. */
  readonly tamper?: boolean;
}

/** Bytes to standard base64. */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** A fresh Ed25519 key pair. */
export async function signingKey(): Promise<SigningKey> {
  const pair = (await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const publicKey = Array.from(raw, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { publicKey, privateKey: pair.privateKey };
}

/** A dataset shaped like Keygen's licence file payload. */
export function keygenDataset(): Record<string, unknown> {
  return {
    meta: {
      issued: "2026-10-01T00:00:00.000Z",
      expiry: "2026-11-01T00:00:00.000Z",
      ttl: 2_678_400,
    },
    data: {
      type: "licenses",
      id: "6a2c1f0e-0b7f-4c0a-9d8e-1f2a3b4c5d6e",
      attributes: {
        name: "Acme on-prem",
        status: "ACTIVE",
        expiry: "2027-10-01T00:00:00.000Z",
        maxMachines: 3,
        maxUsers: 50,
        metadata: { tier: "enterprise" },
      },
    },
    included: [
      { type: "entitlements", id: "e1", attributes: { code: "SSO", name: "Single sign-on" } },
      { type: "entitlements", id: "e2", attributes: { code: "AUDIT_LOG", name: "Audit log" } },
      { type: "products", id: "p1", attributes: { name: "Stackra" } },
    ],
  };
}

/** Seals `plaintext` as Keygen does: `<ciphertext>.<iv>.<tag>`, base64 each. */
export async function sealDataset(
  plaintext: Uint8Array<ArrayBuffer>,
  licenceKey: string,
): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(licenceKey));
  const key = await crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, plaintext),
  );
  const ciphertext = sealed.slice(0, -16);
  const tag = sealed.slice(-16);
  return `${encodeBase64(ciphertext)}.${encodeBase64(iv)}.${encodeBase64(tag)}`;
}

/** An armoured licence file signed with `key`. */
export async function licenceFile(key: SigningKey, shape: LicenceFileShape = {}): Promise<string> {
  const plaintext = new TextEncoder().encode(JSON.stringify(shape.dataset ?? keygenDataset()));
  const enc =
    shape.licenceKey === undefined
      ? encodeBase64(plaintext)
      : await sealDataset(plaintext, shape.licenceKey);
  const signature = new Uint8Array(
    await crypto.subtle.sign("Ed25519", key.privateKey, new TextEncoder().encode(`license/${enc}`)),
  );
  const alg =
    shape.alg ?? (shape.licenceKey === undefined ? "base64+ed25519" : "aes-256-gcm+ed25519");
  const certificate = {
    enc: shape.tamper === true ? `${enc.slice(0, -4)}AAA=` : enc,
    sig: encodeBase64(signature),
    alg,
  };
  const body = encodeBase64(new TextEncoder().encode(JSON.stringify(certificate)));
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN LICENSE FILE-----\n${lines.join("\n")}\n-----END LICENSE FILE-----\n`;
}
