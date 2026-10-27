/**
 * Stackra file contract:
 * Purpose: the `c2pa` driver of `ContentCredentials`: embeds a signed C2PA manifest stating a `ContentCredential` in an
 *          AI-generated image, and reads a verified one back, with the Content Authenticity Initiative's c2pa-rs
 *          engine (`@contentauth/c2pa-node`, MIT/Apache-2.0).
 * Boundary: in process; no provider is called, except the RFC 3161 time-stamp authority when `media.c2pa.timestampUrl`
 *           is set (it receives a hash, never the image). Signs with the certificate chain and key resolved blind
 *           from the secret store (`MEDIA_C2PA_SIGNING_CERTIFICATE`, `MEDIA_C2PA_SIGNING_KEY`, ADR 0173); while
 *           either is empty `attach` refuses with a `RangeError`, and it never signs with a test certificate. Only
 *           `media.c2pa.formats` are signed or read; any other type is a `RangeError`. `read` answers `null` for an
 *           image with no manifest, one the engine cannot parse, or one that does not verify. No certificate exists
 *           yet: built from the C2PA 2.x specification and the c2pa-node docs with recorded-fixture tests,
 *           certification pending (owner D3, 2026-10-27).
 * Runtime: node
 * Governing contract: COM-73, COM-294; ADR 0245 (AI outputs); ADR 0173 (secrets); ADR 0294 (decision 16); STA-789.
 */
import { Builder, LocalSigner, Reader } from "@contentauth/c2pa-node";
import { Driver } from "@stackra/container";

import type { MediaConfig } from "#config/media.config";
import { ContentCredentials } from "#contracts/ports/content-credentials.port";
import type { ContentCredential } from "#contracts/types/content-credential.type";
import { c2paManifestOf } from "#node/functions/c2pa-manifest-of.function";
import { credentialOf } from "#node/functions/credential-of.function";
import type { C2paManifestStore } from "#node/types/c2pa-manifest-store.type";

/**
 * Signs and reads C2PA content credentials with c2pa-rs.
 *
 * @example
 * const signed = await credentials.attach(png, "image/png", {
 *   generator: "figentra-ai/1.4",
 *   aiGenerated: true,
 *   createdAt: now,
 * });
 */
export class C2paContentCredentialsDriver extends Driver(ContentCredentials) {
  private readonly config: MediaConfig;

  /**
   * @param config - the signing settings (`c2pa`) and the certificate and key secrets.
   */
  constructor(config: MediaConfig) {
    super();
    this.config = config;
  }

  /**
   * `bytes` with a signed manifest stating `credential`.
   *
   * @throws RangeError when `contentType` is not signed here, or the certificate or key is not set.
   */
  async attach(
    bytes: Uint8Array,
    contentType: string,
    credential: ContentCredential,
  ): Promise<Uint8Array> {
    const format = this.formatOf(contentType);
    const { c2paSigningCertificate: certificate, c2paSigningKey: key, c2pa } = this.config;
    if (certificate === "" || key === "")
      throw new RangeError("MediaConfig.c2paSigningCertificate and c2paSigningKey are not set");
    const signer = LocalSigner.newSigner(
      Buffer.from(certificate),
      Buffer.from(key),
      c2pa.algorithm,
      c2pa.timestampUrl === "" ? undefined : c2pa.timestampUrl,
    );
    const output: { buffer: Buffer | null } = { buffer: null };
    Builder.withJson(c2paManifestOf(credential, format)).sign(
      signer,
      { buffer: Buffer.from(bytes), mimeType: format },
      output,
    );
    if (output.buffer === null) throw new Error("The C2PA engine wrote no signed image");
    return new Uint8Array(output.buffer);
  }

  /**
   * The verified credential `bytes` carries, or `null`.
   *
   * @throws RangeError when `contentType` is not read here.
   */
  async read(bytes: Uint8Array, contentType: string): Promise<ContentCredential | null> {
    const format = this.formatOf(contentType);
    try {
      const reader = await Reader.fromAsset({ buffer: Buffer.from(bytes), mimeType: format });
      return reader === null ? null : credentialOf(reader.json() as C2paManifestStore);
    } catch {
      // c2pa-rs throws when the image has no manifest store or one it cannot parse: both carry no credential.
      return null;
    }
  }

  /** The bare, lower-cased media type when it is one of `media.c2pa.formats`. */
  private formatOf(contentType: string): string {
    const format = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!this.config.c2pa.formats.includes(format))
      throw new RangeError(`The C2PA driver does not sign ${contentType}`);
    return format;
  }
}
