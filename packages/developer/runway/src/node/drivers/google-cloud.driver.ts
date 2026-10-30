/**
 * Stackra file contract:
 * Purpose: `GoogleCloudDriver`, the Google Cloud API driver of the `GoogleCloud` port: reads and creates a product's
 *          project under Figentra's organisation folder (enabling the Firebase, FCM and IAM APIs), ensures a service
 *          account with one project role, and creates its key.
 * Boundary: `fetch` only. Signs in with the access token workload identity federation gave the job
 *           (`GOOGLE_OAUTH_ACCESS_TOKEN`): there is no Google key (owner Q5). The folder is the job variable
 *           `GOOGLE_PROJECT_FOLDER`. A created key is answered to the caller, which writes it to the vault and EAS and
 *           never logs it.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 5 and 7), ADR 0173.
 */
import { Driver } from "@stackra/container";

import { GoogleProjectState } from "#core/enums/google-project-state.enum";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { GoogleCloud } from "#core/ports/google-cloud.port";
import { MOBILE_ONBOARD_SETTINGS } from "#node/constants/mobile-onboard-settings.constant";
import { awaitOperation } from "#node/functions/await-operation.function";
import { requestJson } from "#node/functions/request-json.function";
import { secretOf } from "#node/functions/secret-of.function";

/** Resource Manager, Service Usage and IAM. */
const MANAGER = "https://cloudresourcemanager.googleapis.com/v3";
const USAGE = "https://serviceusage.googleapis.com/v1";
const IAM = "https://iam.googleapis.com/v1";

/** gRPC code 6, ALREADY_EXISTS. */
const ALREADY_EXISTS = 6;

/**
 * Google Cloud through its APIs.
 *
 * @example
 * const google = new GoogleCloudDriver();
 * await google.projectState("academorix"); // "ours"
 */
export class GoogleCloudDriver extends Driver(GoogleCloud) {
  /** The job's environment; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** `fetch`; a test replaces it. */
  fetch: typeof fetch = globalThis.fetch;

  /** Milliseconds between operation polls; a test sets 0. */
  intervalMs = 2000;

  /** Ours when the identity can read it; missing otherwise (Google answers 403 for both missing and foreign). */
  override async projectState(id: string): Promise<GoogleProjectState> {
    const { status } = await this.call(
      "read project",
      "GET",
      `${MANAGER}/projects/${id}`,
      undefined,
      [403, 404],
    );
    return status === 200 ? GoogleProjectState.Ours : GoogleProjectState.Missing;
  }

  /** Creates the project and enables its APIs; false when the id is taken. */
  override async createProject(id: string, name: string): Promise<boolean> {
    const folder = this.env[MOBILE_ONBOARD_SETTINGS.googleFolder];
    if (folder === undefined || !/^folders\/\d+$/.test(folder))
      throw new RunwayUnresolvedError(
        `${MOBILE_ONBOARD_SETTINGS.googleFolder} must name the organisation folder (folders/<number>)`,
      );
    const created = await this.call(
      "create project",
      "POST",
      `${MANAGER}/projects`,
      // Google's display names take only Latin letters, digits, quotes, hyphens, spaces and "!".
      {
        projectId: id,
        displayName: /^[A-Za-z0-9'" !-]{4,30}$/.test(name) ? name : id,
        parent: folder,
      },
      [409],
    );
    if (created.status === 409) return false;
    const outcome = await this.operation("create project", MANAGER, created.body["name"]);
    if (outcome.error?.["code"] === ALREADY_EXISTS) return false;
    if (outcome.error !== undefined)
      throw new RunwayUnresolvedError(
        `Google Cloud: create project ${id}: ${String(outcome.error["message"])}`,
      );
    const enabled = await this.call(
      "enable APIs",
      "POST",
      `${USAGE}/projects/${id}/services:batchEnable`,
      {
        serviceIds: MOBILE_ONBOARD_SETTINGS.googleApis,
      },
    );
    await this.operation("enable APIs", USAGE, enabled.body["name"]);
    return true;
  }

  /** The account's email, created unless it exists, with `role` on the project. */
  override async ensureServiceAccount(
    project: string,
    name: string,
    role: string,
  ): Promise<string> {
    const email = `${name}@${project}.iam.gserviceaccount.com`;
    const found = await this.call(
      "read service account",
      "GET",
      `${IAM}/projects/${project}/serviceAccounts/${email}`,
      undefined,
      [404],
    );
    if (found.status === 404)
      await this.call(
        "create service account",
        "POST",
        `${IAM}/projects/${project}/serviceAccounts`,
        { accountId: name, serviceAccount: { displayName: name } },
        [409],
      );
    const member = `serviceAccount:${email}`;
    const { body: policy } = await this.call(
      "read IAM policy",
      "POST",
      `${MANAGER}/projects/${project}:getIamPolicy`,
      {},
    );
    const bindings = Array.isArray(policy["bindings"])
      ? (policy["bindings"] as { role?: unknown; members?: unknown }[])
      : [];
    const binding = bindings.find((item) => item.role === role);
    const members = Array.isArray(binding?.members) ? (binding.members as string[]) : [];
    if (!members.includes(member)) {
      const next =
        binding === undefined
          ? [...bindings, { role, members: [member] }]
          : bindings.map((item) =>
              item === binding ? { role, members: [...members, member] } : item,
            );
      await this.call("grant role", "POST", `${MANAGER}/projects/${project}:setIamPolicy`, {
        policy: { ...policy, bindings: next },
      });
    }
    return email;
  }

  /** A new JSON key for the account. */
  override async createKey(project: string, email: string): Promise<string> {
    const { body } = await this.call(
      "create service account key",
      "POST",
      `${IAM}/projects/${project}/serviceAccounts/${email}/keys`,
      {},
    );
    const data = body["privateKeyData"];
    if (typeof data !== "string")
      throw new RunwayUnresolvedError("Google Cloud: create service account key: no key");
    return Buffer.from(data, "base64").toString("utf8");
  }

  /** One authorised request. */
  private call(
    what: string,
    method: string,
    url: string,
    body?: unknown,
    accept?: readonly number[],
  ) {
    return requestJson(this.fetch, {
      what: `Google Cloud: ${what}`,
      method,
      url,
      headers: this.headers(),
      ...(body === undefined ? {} : { body }),
      ...(accept === undefined ? {} : { accept }),
    });
  }

  /** Waits for the operation `name`. */
  private operation(what: string, base: string, name: unknown) {
    return awaitOperation(this.fetch, {
      what: `Google Cloud: ${what}`,
      base,
      name: String(name),
      headers: this.headers(),
      intervalMs: this.intervalMs,
    });
  }

  /** The bearer header. */
  private headers(): Record<string, string> {
    return { authorization: `Bearer ${secretOf(this.env, MOBILE_ONBOARD_SETTINGS.googleToken)}` };
  }
}
