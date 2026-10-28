/**
 * Stackra file contract:
 * Purpose: `checkProvenance`: the provenance check of one publish.
 * Boundary: no chain verification: Fulcio and Rekor are checked by consumers (`gh attestation verify`) and the
 *           release smoke job, as the ADR decides. shortcut: the identity is found as a byte string in the
 *           certificate DER rather than by parsing its SAN extension; upgrade to an X.509 parser if a client ever
 *           sends a certificate whose other fields could carry that URI.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 9).
 */
import { fromBase64 } from "#src/bytes/from-base64";
import type { ProvenanceVerdict } from "#src/interfaces/provenance-verdict.type";
import type { PublisherRow } from "#src/interfaces/publisher-row.interface";
import type { TarballDigests } from "#src/interfaces/tarball-digests.interface";

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
  readonly subject?: readonly {
    readonly digest?: { readonly sha256?: unknown; readonly sha512?: unknown };
  }[];
}

const refuse = (reason: string): ProvenanceVerdict => ({ ok: false, reason });

/**
 * The provenance check of one publish.
 *
 * @param bundle - the `.sigstore` attachment's text, or null when it is missing.
 * @param digests - the tarball's SHA-256 and SHA-512 hex; a subject matches by either (npm writes sha512).
 * @param publisher - the trusted publisher of the token's repository.
 * @example
 * checkProvenance(text, digests, publisher); // { ok: true, predicateType: "https://slsa.dev/provenance/v1" }
 */
export function checkProvenance(
  bundle: string | null,
  digests: Pick<TarballDigests, "sha256" | "sha512">,
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
  const matches = (subject: NonNullable<Statement["subject"]>[number]): boolean =>
    subject.digest?.sha512 === digests.sha512 || subject.digest?.sha256 === digests.sha256;
  if (!(statement.subject ?? []).some(matches))
    return refuse("provenance subject is not this tarball");
  if (typeof statement.predicateType !== "string")
    return refuse("provenance has no predicate type");
  const material = parsed.verificationMaterial;
  const raw =
    material?.certificate?.rawBytes ?? material?.x509CertificateChain?.certificates?.[0]?.rawBytes;
  if (raw === undefined) return refuse("provenance has no signing certificate");
  let der: string;
  try {
    der = String.fromCodePoint(...fromBase64(raw));
  } catch {
    return refuse("provenance certificate is not base64");
  }
  const identity = `https://github.com/${publisher.repository}/${publisher.workflow}@${publisher.ref}`;
  if (!der.includes(identity)) return refuse(`provenance was not signed by ${identity}`);
  return { ok: true, predicateType: statement.predicateType };
}
