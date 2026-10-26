/**
 * Stackra file contract:
 * Purpose: `s3TargetOf(url)`, the S3 delivery target an endpoint URL names: `s3://<bucket>/<prefix>?region=<region>`,
 *          or undefined for any other URL (an https endpoint).
 * Boundary: pure. The bucket follows the S3 naming rule (3 to 63 lower-case letters, digits, dots and hyphens); a
 *           prefix segment is never `.` or `..`; the only query parameter is `region`. A URL that starts with `s3:`
 *           and breaks a rule throws, so a typo is refused at registration, never written to a wrong key.
 * Runtime: isomorphic
 * Governing contract: ADR 0422 (decision 4).
 */
import type { S3Target } from "#core/types/s3-target.type";

/** An S3 bucket name. */
const BUCKET = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

/** An AWS region code. */
const REGION = /^[a-z]{2}(-[a-z]+)+-\d$/;

/**
 * The S3 target of `url`, or undefined when `url` is not an `s3:` URL.
 *
 * @throws TypeError when `url` is an `s3:` URL with a bad bucket, prefix or query.
 * @example
 * s3TargetOf("s3://acme-siem/stackra?region=me-central-1"); // { bucket: "acme-siem", prefix: "stackra", region: "me-central-1" }
 */
export function s3TargetOf(url: string): S3Target | undefined {
  if (!url.startsWith("s3://")) return undefined;
  const [location = "", query] = url.slice("s3://".length).split("?", 2);
  const [bucket = "", ...segments] = location.split("/");
  const prefix = segments.filter((segment) => segment !== "");
  const params = new URLSearchParams(query ?? "");
  const region = params.get("region") ?? undefined;
  if (
    !BUCKET.test(bucket) ||
    prefix.some((segment) => segment === "." || segment === "..") ||
    [...params.keys()].some((key) => key !== "region") ||
    (region !== undefined && !REGION.test(region))
  )
    throw new TypeError(`${url} is not an s3://<bucket>/<prefix>?region=<region> delivery target`);
  return { bucket, prefix: prefix.join("/"), ...(region === undefined ? {} : { region }) };
}
