/**
 * Stackra file contract:
 * Purpose: `GOTENBERG_SETTINGS`, the PDF engine a `gotenberg` resource runs: the Chromium image pinned by digest under
 *          the ECR pull-through prefix, its port, the arguments that lock it down, and the names it and its consumers
 *          read: DocumentsConfig's `DOCUMENTS_GOTENBERG_URL` and `DOCUMENTS_GOTENBERG_AUTHORIZATION`, and Gotenberg's own
 *          basic-auth pair.
 * Boundary: data only. The image is a path under the account's ECR pull-through cache for Docker Hub (`docker-hub/`,
 *           INFRA-CODE's account baseline), never Docker Hub directly; a new version is a digest bump by pull request.
 *           Chromium renders the inline HTML and assets it is posted and fetches nothing: it may load only the
 *           request's own files under /tmp, and downloads and webhooks are off. Values are never here, only names.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (as amended: the gotenberg resource), ADR 0173 (names only); @stackra/documents
 *                     DocumentsConfig.
 */

/** One PDF engine per environment. */
export const GOTENBERG_SETTINGS = Object.freeze({
  /** The image under the pull-through prefix: Gotenberg 8.38.1, Chromium only (2026-10-15). */
  image:
    "docker-hub/gotenberg/gotenberg@sha256:5da4ab7b8fe7326537369e17b661be765d9a2887f77722faacdbe6d55812fb96",
  /** The API port. */
  port: 3000,
  /** The arguments: basic auth on, no webhooks, no downloads, Chromium limited to the request's own files. */
  command: [
    "gotenberg",
    "--api-enable-basic-auth",
    "--webhook-disable",
    "--api-disable-download-from",
    // RE2 has no lookahead, so the allow-list names what Chromium may load: the request's own files, nothing else
    "--chromium-allow-list=^file:///tmp/.*",
  ],
  /** The basic-auth user; the password is generated per environment. */
  user: "stackra",
  /** The names Gotenberg reads its basic auth under. */
  serverUser: "GOTENBERG_API_BASIC_AUTH_USERNAME",
  serverPassword: "GOTENBERG_API_BASIC_AUTH_PASSWORD",
  /** The names a consumer's DocumentsConfig reads. */
  url: "DOCUMENTS_GOTENBERG_URL",
  authorization: "DOCUMENTS_GOTENBERG_AUTHORIZATION",
} as const);
