/**
 * Stackra file contract:
 * Purpose: `provenanceOf`: the source repository, commit, workflow, ref and run of a stored Sigstore bundle's SLSA v1
 *          statement, with the version's recorded publisher run as the run when the statement names none.
 * Boundary: pure; reads only what the publish already checked and stored (no verification here, as ADR 0453
 *           decision 9: consumers verify with `gh attestation verify`). Returns null when the bundle is unreadable.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 9).
 */
import { fromBase64 } from "#src/bytes/from-base64";
import type { ProvenanceSummary } from "#src/interfaces/provenance-summary.interface";

/** The parts of an SLSA v1 (npm, GitHub Actions) statement the browser reads. */
interface Statement {
  readonly predicate?: {
    readonly buildDefinition?: {
      readonly externalParameters?: {
        readonly workflow?: {
          readonly repository?: unknown;
          readonly path?: unknown;
          readonly ref?: unknown;
        };
      };
      readonly resolvedDependencies?: readonly {
        readonly uri?: unknown;
        readonly digest?: { readonly gitCommit?: unknown };
      }[];
    };
    readonly runDetails?: { readonly metadata?: { readonly invocationId?: unknown } };
  };
}

const text = (value: unknown): string | null =>
  typeof value === "string" && value !== "" ? value : null;

/**
 * The provenance summary of a stored bundle.
 *
 * @param bundle - the bundle as R2 holds it (JSON text).
 * @param publisherRun - the version's `publisher_run` (the OIDC-exchanged run URL).
 * @example
 * provenanceOf(bundleText, "https://github.com/figentra/stackra/actions/runs/42/attempts/1")?.commit;
 */
export function provenanceOf(bundle: string, publisherRun: string): ProvenanceSummary | null {
  let statement: Statement;
  try {
    const parsed = JSON.parse(bundle) as { dsseEnvelope?: { payload?: string } };
    statement = JSON.parse(
      new TextDecoder().decode(fromBase64(parsed.dsseEnvelope?.payload ?? "")),
    ) as Statement;
  } catch {
    return null;
  }
  const build = statement.predicate?.buildDefinition;
  const workflow = build?.externalParameters?.workflow;
  const source = build?.resolvedDependencies?.[0];
  return {
    repository: text(workflow?.repository),
    commit: text(source?.digest?.gitCommit),
    workflow: text(workflow?.path),
    ref: text(workflow?.ref),
    run: text(statement.predicate?.runDetails?.metadata?.invocationId) ?? text(publisherRun),
  };
}
