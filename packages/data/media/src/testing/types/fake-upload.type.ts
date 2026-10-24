/**
 * Stackra file contract:
 * Purpose: `FakeUpload<B>`, what `fakeUpload` returns: a real `Upload<B>` token plus the URL the file gets once claimed,
 *          for a test to compare with what the action recorded.
 * Boundary: a type only. `url` is test knowledge, not part of the wire token: an action input's schema drops it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's `expect(...).toEqual({ url: image.url, alt: null })`.
 */
import type { Bucket, Upload } from "#core/index";

/** A finished upload and its URL after the claim. */
export type FakeUpload<B extends Bucket = Bucket> = Upload<B> & {
  /** The URL `MediaLibrary.claim` returns for it. */
  readonly url: string;
};
