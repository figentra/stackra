/**
 * Stackra file contract:
 * Purpose: the `ContentCredentials` port: attaches a signed C2PA manifest to an AI-generated image and reads one back,
 *          so a viewer can tell the image was made by a model, and whether a trusted signer says so.
 * Boundary: an abstract class that is its own token, keyed `media.ContentCredentials`. The driver signs with the
 *           certificate it is configured with (a secret it reads from the runtime, never config). `read` answers
 *           `null` for an image without a manifest, and otherwise a reading: `trusted` only when the manifest
 *           verifies and its signer chains to an anchor the driver allows, `unverified` when it verifies otherwise,
 *           `invalid` when it does not. Only a `trusted` reading may be shown as genuine. Which images must carry a
 *           credential is the AI module's rule, not this port's.
 * Runtime: isomorphic
 * Governing contract: COM-73, COM-294; ADR 0245; ADR 0173 (secrets); ADR 0294 (decisions 4 and 16); STA-2791 (CTO
 *                     decision of 2026-11-25).
 */
import { Port } from "@stackra/contracts";

import type { ContentCredential } from "#contracts/types/content-credential.type";
import type { ContentCredentialReading } from "#contracts/types/content-credential-reading.type";

/**
 * Signs and reads C2PA content credentials.
 *
 * @example
 * const signed = await credentials.attach(png, "image/png", { generator, aiGenerated: true, createdAt: now });
 * const reading = await credentials.read(signed, "image/png");
 * const genuine = reading?.trust === ContentCredentialTrust.Trusted;
 */
export abstract class ContentCredentials extends Port {
  /** Type-only port key, so `DriverName<ContentCredentials>` narrows to this port's drivers. */
  declare readonly "~key": "media.ContentCredentials";

  /**
   * `bytes` with a signed manifest stating `credential`.
   *
   * @throws RangeError when `contentType` is not an image format the driver signs.
   */
  abstract attach(
    bytes: Uint8Array,
    contentType: string,
    credential: ContentCredential,
  ): Promise<Uint8Array>;

  /**
   * The credential `bytes` carries and how far it is trusted (`trusted`, `unverified` or `invalid`), or `null` when
   * it carries none.
   *
   * @throws RangeError when `contentType` is not an image format the driver reads.
   */
  abstract read(bytes: Uint8Array, contentType: string): Promise<ContentCredentialReading | null>;
}
