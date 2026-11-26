/**
 * Stackra file contract:
 * Purpose: `ImageStep`, the steps of Runway's image supply chain in the order the image step runs them: build, the
 *          Trivy scan, push, the syft SBOM, the cosign signature, the SBOM attestation and the cosign verify.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0174 (decisions 1 and 2); STA-609.
 */
/** One step of the image supply chain, named by the refusal it raises. */
export type ImageStep = "build" | "scan" | "push" | "sbom" | "sign" | "attest" | "verify";
