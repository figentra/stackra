/**
 * Stackra file contract:
 * Purpose: `checkProvenance`: the provenance check of one publish.
 * Boundary: no chain verification: Fulcio and Rekor are checked by consumers (`gh attestation verify`) and the
 *           release smoke job, as the ADR decides. shortcut: the identity is found as a byte string in the
 *           certificate DER rather than by parsing its SAN extension; upgrade to an X.509 parser if a client ever
 *           sends a certificate whose other fields could carry that URI.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 9).
 */
import { fromBase64 } from "#src/bytes/from-base64";
import type { ProvenanceVerdict } from "#src/interfaces/provenance-verdict.type";
import type { PublisherRow } from "#src/interfaces/publisher-row.interface";

/** The parts of a Sigstore bundle (v0.1 to v0.3) the check reads. */
interface SigstoreBundle {
  readonly verificationMaterial?: {
    readonly certificate?: { readonly rawBytes?: string };
    readonly x509CertificateChain?: {
      readonly certificates?: readonly { readonly rawBytes?: string }[];
    };
  };
  readonly dsseEnvelope?: { readonly payload?: string };
}

/** The in-toto statement inside the envelope. */
interface Statement {
  readonly predicateType?: unknown;
  readonly subject?: readonly { readonly digest?: { readonly sha256?: unknown } }[];
}

const refuse = (reason: string): ProvenanceVerdict => ({ ok: false, reason });

/**
 * The provenance check of one publish.
 *
 * @param bundle - the `.sigstore` attachment's text, or null when it is missing.
 * @param sha256 - the tarball's SHA-256 hex.
 * @param publisher - the trusted publisher of the token's repository.
 * @example
 * checkProvenance(text, digests.sha256, publisher); // { ok: true, predicateType: "https://slsa.dev/provenance/v1" }
 */
export function checkProvenance(
  bundle: string | null,
  sha256: string,
  publisher: PublisherRow,
): ProvenanceVerdict {
  if (bundle === null) return refuse("provenance bundle is missing");
  let parsed: SigstoreBundle;
  let statement: Statement;
  try {
    parsed = JSON.parse(bundle) as SigstoreBundle;
    statement = JSON.parse(
      new TextDecoder().decode(fromBase64(parsed.dsseEnvelope?.payload ?? "")),
    ) as Statement;
  } catch {
    return refuse("provenance bundle is not a Sigstore DSSE bundle");
  }
  if (!(statement.subject ?? []).some((subject) => subject.digest?.sha256 === sha256))
    return refuse("provenance subject is not this tarball");
  if (typeof statement.predicateType !== "string")
    return refuse("provenance has no predicate type");
  const material = parsed.verificationMaterial;
  const raw =
    material?.certificate?.rawBytes ?? material?.x509CertificateChain?.certificates?.[0]?.rawBytes;
  if (raw === undefined) return refuse("provenance has no signing certificate");
  let der: string;
  try {
    der = String.fromCharCode(...fromBase64(raw));
  } catch {
    return refuse("provenance certificate is not base64");
  }
  const identity = `https://github.com/${publisher.repository}/${publisher.workflow}@${publisher.ref}`;
  if (!der.includes(identity)) return refuse(`provenance was not signed by ${identity}`);
  return { ok: true, predicateType: statement.predicateType };
}
