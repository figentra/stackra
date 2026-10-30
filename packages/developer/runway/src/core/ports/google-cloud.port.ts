/**
 * Stackra file contract:
 * Purpose: the `GoogleCloud` port: the Google Cloud calls mobile onboarding makes: read and create a product's project
 *          by its chosen id, ensure a service account in it, and create that account's key.
 * Boundary: an abstract class that is its own token. The real driver signs in with GitHub OIDC through workload
 *           identity federation (no Google key, ADR 0482 decision 5); the memory driver keeps state in the process. A
 *           created key is a secret: the caller writes it straight into the vault and EAS and never logs it, as
 *           `PreviewDatabaseBrancher` does with a connection string.
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decisions 5 and 7), ADR 0173, ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { GoogleProjectState } from "#core/enums/google-project-state.enum";

/** Google Cloud's project side. */
export abstract class GoogleCloud extends Port {
  /** Whether the project `id` is ours, missing or taken. */
  abstract projectState(id: string): Promise<GoogleProjectState>;

  /**
   * Creates the project `id` named `name` under the configured organisation folder, with the APIs onboarding uses;
   * false when Google answers that another owner holds the id (a read cannot tell taken from missing).
   */
  abstract createProject(id: string, name: string): Promise<boolean>;

  /** The email of the service account `name` in `project`, created unless it exists, holding `role` on it. */
  abstract ensureServiceAccount(project: string, name: string, role: string): Promise<string>;

  /** Creates a JSON key for the service account `email` and answers it; the caller never logs it. */
  abstract createKey(project: string, email: string): Promise<string>;
}
