/**
 * Stackra file contract:
 * Purpose: what a `SignatureField` holds: a drawn signature as SVG path data in its box, or a typed name.
 * Boundary: types only. It is the mark, not a legal signature: the e-signature port (`@stackra/documents`) binds it to
 *           a document, a signer and evidence.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); stackra-package-needs conflict 4 (the e-signature port is
 *                     `@stackra/documents`').
 */

/** A signature. */
export type SignatureValue =
  | {
      /** Drawn with a pointer. */
      readonly kind: "drawn";
      /** The strokes as SVG path data. */
      readonly path: string;
      /** The box the path is drawn in, `0 0 <width> <height>`. */
      readonly viewBox: string;
    }
  | {
      /** Typed as a name, the keyboard way to sign. */
      readonly kind: "typed";
      /** The name as typed. */
      readonly text: string;
    };
