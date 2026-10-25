/**
 * Stackra file contract:
 * Purpose: unit tests of the processing ports `TextExtractor`, `ImageTransformer` and `ContentCredentials`: a driver
 *          extends each with `Driver(...)` and is an instance of the port.
 * Boundary: test only; the drivers are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ContentCredentials } from "#contracts/ports/content-credentials.port";
import { ImageTransformer } from "#contracts/ports/image-transformer.port";
import { TextExtractor } from "#contracts/ports/text-extractor.port";
import type { ContentCredential } from "#contracts/types/content-credential.type";
import type { ExtractedText } from "#contracts/types/extracted-text.type";

/** Reads plain text only. */
class PlainTextExtractorDriver extends Driver(TextExtractor) {
  async extract(
    bytes: Uint8Array,
    contentType: string,
    languages: readonly string[],
  ): Promise<ExtractedText> {
    if (contentType !== "text/plain") throw new RangeError(contentType);
    return { text: new TextDecoder().decode(bytes), languages: [...languages] };
  }
}

/** Returns the bytes unchanged. */
class IdentityImageTransformerDriver extends Driver(ImageTransformer) {
  async transform(bytes: Uint8Array): Promise<Uint8Array> {
    return bytes;
  }
}

/** Keeps the credential beside the bytes. */
class KeptContentCredentialsDriver extends Driver(ContentCredentials) {
  private readonly kept = new WeakMap<Uint8Array, ContentCredential>();

  async attach(
    bytes: Uint8Array,
    _contentType: string,
    credential: ContentCredential,
  ): Promise<Uint8Array> {
    const signed = bytes.slice();
    this.kept.set(signed, credential);
    return signed;
  }

  async read(bytes: Uint8Array): Promise<ContentCredential | null> {
    return this.kept.get(bytes) ?? null;
  }
}

describe("media processing ports", () => {
  it("are ports their drivers implement", async () => {
    const extractor = new PlainTextExtractorDriver();
    expect(extractor).toBeInstanceOf(TextExtractor);
    expect(extractor).toBeInstanceOf(Port);
    expect(
      await extractor.extract(new TextEncoder().encode("مرحبا"), "text/plain", ["ar"]),
    ).toEqual({
      text: "مرحبا",
      languages: ["ar"],
    });
    expect(new IdentityImageTransformerDriver()).toBeInstanceOf(ImageTransformer);
    const credentials = new KeptContentCredentialsDriver();
    const credential = { generator: "test", aiGenerated: true, createdAt: new Date(0) };
    const signed = await credentials.attach(new Uint8Array([1]), "image/png", credential);
    expect(await credentials.read(signed, "image/png")).toBe(credential);
    expect(await credentials.read(new Uint8Array([1]), "image/png")).toBeNull();
  });
});
