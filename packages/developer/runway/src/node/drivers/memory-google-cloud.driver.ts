/**
 * Stackra file contract:
 * Purpose: `MemoryGoogleCloudDriver`, the in-memory driver of the `GoogleCloud` port: projects and service accounts
 *          live in sets and every change is recorded in order; a created key is the fixed `key` value, so a test can
 *          check it never reaches any output.
 * Boundary: calls nothing outside the process. Seed `ours` and `taken` for what Google already has.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 5 and 7).
 */
import { Driver } from "@stackra/container";

import { GoogleProjectState } from "#core/enums/google-project-state.enum";
import { GoogleCloud } from "#core/ports/google-cloud.port";

/**
 * Google Cloud in memory.
 *
 * @example
 * const google = new MemoryGoogleCloudDriver();
 * google.taken.add("academorix");
 */
export class MemoryGoogleCloudDriver extends Driver(GoogleCloud) {
  /** Project ids Runway can use. */
  readonly ours = new Set<string>();

  /** Project ids someone else holds. */
  readonly taken = new Set<string>();

  /** Service account emails. */
  readonly accounts = new Set<string>();

  /** Every change, in order, as `<method> <arguments>`; never a key. */
  readonly calls: string[] = [];

  /** The key every `createKey` answers. */
  key = '{"type":"service_account","private_key":"memory-canary"}';

  /** Ours, taken or missing. */
  override async projectState(id: string): Promise<GoogleProjectState> {
    if (this.ours.has(id)) return GoogleProjectState.Ours;
    return this.taken.has(id) ? GoogleProjectState.Taken : GoogleProjectState.Missing;
  }

  /** Creates the project; false when it is taken. */
  override async createProject(id: string, name: string): Promise<boolean> {
    if (this.taken.has(id)) return false;
    this.calls.push(`createProject ${id} ${name}`);
    this.ours.add(id);
    return true;
  }

  /** The account's email, created unless it exists. */
  override async ensureServiceAccount(
    project: string,
    name: string,
    role: string,
  ): Promise<string> {
    const email = `${name}@${project}.iam.gserviceaccount.com`;
    if (!this.accounts.has(email))
      this.calls.push(`ensureServiceAccount ${project} ${name} ${role}`);
    this.accounts.add(email);
    return email;
  }

  /** Answers the fixed `key` and records the call, never the key. */
  override async createKey(project: string, email: string): Promise<string> {
    this.calls.push(`createKey ${project} ${email}`);
    return this.key;
  }
}
