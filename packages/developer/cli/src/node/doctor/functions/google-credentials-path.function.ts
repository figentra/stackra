/**
 * Stackra file contract:
 * Purpose: `googleCredentialsPath(env, home)`, where the Google Application Default Credentials that sops decrypts
 *          figentra/secrets with live: `GOOGLE_APPLICATION_CREDENTIALS`, else `application_default_credentials.json`
 *          in the gcloud config folder (`CLOUDSDK_CONFIG`, default `~/.config/gcloud`). `stackra doctor` checks the
 *          file exists; it never opens it.
 * Boundary: pure; reads no file.
 * Runtime: node
 * Governing contract: ADR 0525 (SOPS and Cloud KMS replace Infisical); ADR 0027.
 */
import { join } from "node:path";

/**
 * The credentials file sops would use.
 *
 * @param env - the process environment.
 * @param home - the user's home folder.
 * @example
 * googleCredentialsPath({}, "/Users/me"); // "/Users/me/.config/gcloud/application_default_credentials.json"
 */
export function googleCredentialsPath(
  env: Readonly<Record<string, string | undefined>>,
  home: string,
): string {
  return (
    env["GOOGLE_APPLICATION_CREDENTIALS"] ||
    join(
      env["CLOUDSDK_CONFIG"] || join(home, ".config", "gcloud"),
      "application_default_credentials.json",
    )
  );
}
