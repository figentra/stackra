/**
 * Stackra file contract:
 * Purpose: the `c2pa` driver of `ContentCredentials`: embeds a signed C2PA manifest stating a `ContentCredential` in an
 *          AI-generated image, and reads one back with how far it is trusted, with the Content Authenticity
 *          Initiative's c2pa-rs engine (`@contentauth/c2pa-node`, MIT/Apache-2.0).
 * Boundary: in process; no provider is called, except the RFC 3161 time-stamp authority when `media.c2pa.timestampUrl`
 *           is set (it receives a hash, never the image). Signs with the certificate chain and key resolved blind
 *           from the secret store (`MEDIA_C2PA_SIGNING_CERTIFICATE`, `MEDIA_C2PA_SIGNING_KEY`, ADR 0173); while
 *           either is empty `attach` refuses with a `RangeError`, and it never signs with a test certificate. Only
 *           `media.c2pa.formats` are signed or read; any other type is a `RangeError`. `read` is `trusted` only when
 *           c2pa-rs validates the manifest and its signer chains to an anchor of the pinned C2PA trust list
 *           (`C2PA_TRUST_LIST`) or is one of our own signing certificates (the configured signing certificate and
 *           `media.c2pa.trustedSigners`); a manifest that verifies otherwise is `unverified`, one that does not is
 *           `invalid`. It fails closed: with no usable anchor (an empty or unreadable list, every anchor expired) it is
 *           never `trusted`; an expired anchor or signer is dropped. It never fetches a remote manifest or an OCSP
 *           answer. `read` answers `null` for an image with no manifest, one the engine cannot parse, or one that
 *           states no credential. No certificate exists yet: built from the C2PA 2.x specification and the c2pa-node
 *           docs with recorded-fixture tests and a real-engine round trip, certification pending (owner D3,
 *           2026-10-27).
 * Runtime: node
 * Governing contract: COM-73, COM-294; ADR 0245 (AI outputs); ADR 0173 (secrets); ADR 0294 (decision 16); STA-789;
 *                     STA-2791 (CTO decision of 2026-11-25: trusted, unverified or invalid, fail closed).
 */
import type { X509Certificate } from "node:crypto";

import { Builder, Context, LocalSigner, Reader } from "@contentauth/c2pa-node";
import { Driver } from "@stackra/container";

import type { MediaConfig } from "#config/media.config";
import { ContentCredentialTrust } from "#contracts/enums/content-credential-trust.enum";
import { ContentCredentials } from "#contracts/ports/content-credentials.port";
import type { ContentCredential } from "#contracts/types/content-credential.type";
import type { ContentCredentialReading } from "#contracts/types/content-credential-reading.type";
import { C2PA_TRUST_LIST } from "#node/constants/c2pa-trust-list.constant";
import { c2paManifestOf } from "#node/functions/c2pa-manifest-of.function";
import { certificatesIn } from "#node/functions/certificates-in.function";
import { credentialOf } from "#node/functions/credential-of.function";
import { credentialTrustOf } from "#node/functions/credential-trust-of.function";
import type { C2paManifestStore } from "#node/types/c2pa-manifest-store.type";

/** The certificates of `certificates` valid at `at`, as one PEM text (empty when none is). */
function pemValidAt(certificates: readonly X509Certificate[], at: Date): string {
  return certificates
    .filter(({ validFromDate, validToDate }) => validFromDate <= at && at <= validToDate)
    .map((certificate) => certificate.toString())
    .join("");
}

/**
 * Signs and reads C2PA content credentials with c2pa-rs.
 *
 * @example
 * const signed = await credentials.attach(png, "image/png", {
 *   generator: "figentra-ai/1.4",
 *   aiGenerated: true,
 *   createdAt: now,
 * });
 * const reading = await credentials.read(signed, "image/png"); // { trust: "trusted", credential }
 */
export class C2paContentCredentialsDriver extends Driver(ContentCredentials) {
  private readonly config: MediaConfig;

  /** The readable certificates of the trust list, parsed on the first read. */
  private anchors: readonly X509Certificate[] | undefined;

  /** Our own signing certificates (end-entity only), parsed on the first read. */
  private signers: readonly X509Certificate[] | undefined;

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
   * The credential `bytes` carries and how far it is trusted, or `null` when it carries none.
   *
   * @throws RangeError when `contentType` is not read here.
   */
  async read(bytes: Uint8Array, contentType: string): Promise<ContentCredentialReading | null> {
    const format = this.formatOf(contentType);
    const now = new Date();
    const anchors = pemValidAt(this.trustAnchors(), now);
    const signers = pemValidAt(this.ownSigners(), now);
    let store: C2paManifestStore;
    try {
      const reader = await Reader.fromAsset(
        { buffer: Buffer.from(bytes), mimeType: format },
        new Context({
          verify: {
            verifyTrust: true,
            verifyTimestampTrust: true,
            verifyAfterReading: true,
            ocspFetch: false,
            remoteManifestFetch: false,
          },
          // c2pa-rs keeps the allowed list only beside an anchor list, so an empty anchor list trusts nobody.
          ...(anchors === ""
            ? {}
            : {
                trust: {
                  trustAnchors: anchors,
                  ...(signers === "" ? {} : { allowedList: signers }),
                },
              }),
        }),
      );
      if (reader === null) return null;
      store = reader.json() as C2paManifestStore;
    } catch {
      // c2pa-rs throws when the image has no manifest store or one it cannot parse: both carry no credential.
      return null;
    }
    const verdict = credentialTrustOf(store);
    if (verdict === ContentCredentialTrust.Invalid) return { trust: verdict };
    const credential = credentialOf(store);
    if (credential === null) return null;
    // Fail closed: with no usable anchor nothing is trusted, whatever the engine says.
    return {
      trust: anchors === "" ? ContentCredentialTrust.Unverified : verdict,
      credential,
    };
  }

  /**
   * The PEM text of the trust list: the pinned C2PA trust list. Read once; a list that cannot be read is no anchor.
   */
  protected trustList(): string {
    return C2PA_TRUST_LIST;
  }

  /** The trust list's readable certificates, parsed once; none when it cannot be read. */
  private trustAnchors(): readonly X509Certificate[] {
    if (this.anchors === undefined) {
      try {
        this.anchors = certificatesIn(this.trustList());
      } catch {
        this.anchors = [];
      }
    }
    return this.anchors;
  }

  /**
   * Our own signing certificates, parsed once: the end-entity certificate of the signing chain and those of
   * `media.c2pa.trustedSigners` (earlier certificates kept after a rotation). A CA certificate there is ignored.
   */
  private ownSigners(): readonly X509Certificate[] {
    this.signers ??= [
      this.config.c2paSigningCertificate,
      ...(this.config.c2pa.trustedSigners ?? []),
    ].flatMap((pem) =>
      certificatesIn(pem)
        .filter((certificate) => !certificate.ca)
        .slice(0, 1),
    );
    return this.signers;
  }

  /** The bare, lower-cased media type when it is one of `media.c2pa.formats`. */
  private formatOf(contentType: string): string {
    const format = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!this.config.c2pa.formats.includes(format))
      throw new RangeError(`The C2PA driver does not sign ${contentType}`);
    return format;
  }
}
