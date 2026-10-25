/**
 * Stackra file contract:
 * Purpose: `ContentCredential`, the C2PA claim attached to an image an AI model generated or edited: which tool made
 *          it, that it is AI-generated (the IPTC digital source type `trainedAlgorithmicMedia`), and when.
 * Boundary: a type only; the subset of a C2PA manifest the platform writes and reads. The signing certificate is the
 *           driver's, held as a secret, never a field here.
 * Runtime: isomorphic
 * Governing contract: COM-73, COM-294 (content credentials on AI-generated images); ADR 0245 (AI outputs).
 */

/** The content credential of one image. */
export interface ContentCredential {
  /** The tool that made the image (`figentra-ai/1.4 (image model name)`). */
  readonly generator: string;

  /** Whether a model generated or edited the image. */
  readonly aiGenerated: boolean;

  /** When the image was made. */
  readonly createdAt: Date;
}
