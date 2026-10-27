/**
 * Stackra file contract:
 * Purpose: `putPackage`: `PUT /@scope%2fname`: publish one version, or deprecate.
 * Boundary: writes through `RegistryStore`, R2 and KV only. No unpublish and no human publish.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 6, 7, 8, 9 and 11); ADR 0013 (immutable versions).
 */
import { fromBase64 } from "#src/bytes/from-base64";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import { splitName } from "#src/http/split-name";
import type { Bytes } from "#src/interfaces/bytes.type";
import type { PublishTokenRow } from "#src/interfaces/publish-token-row.interface";
import type { R2Bucket } from "#src/interfaces/r2-bucket.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import type { TarballContents } from "#src/interfaces/tarball-contents.interface";
import { attestationKey } from "#src/npm/attestation-key";
import { forgetPackument } from "#src/npm/forget-packument";
import { tarballKey } from "#src/npm/tarball-key";
import { checkProvenance } from "#src/publish/check-provenance";
import { checkPublish } from "#src/publish/check-publish";
import { tarballDigests } from "#src/publish/tarball-digests";
import { publishAuth } from "#src/publish/publish-auth";
import { readTarball } from "#src/publish/read-tarball";
import { TarballError } from "#src/publish/tarball-error";
import { VersionExistsError } from "#src/store/version-exists-error";

/** One `_attachments` entry of an npm publish body. */
interface Attachment {
  readonly data?: unknown;
}

/** The parts of an npm publish body the registry reads. */
interface PublishBody {
  readonly versions?: Record<
    string,
    { readonly dist?: Record<string, unknown>; readonly deprecated?: unknown }
  >;
  readonly "dist-tags"?: Record<string, unknown>;
  readonly _attachments?: Record<string, Attachment>;
}

/** Room for base64 (4/3) and the JSON around the tarball. */
const bodyLimit = (maxTarballBytes: number): number =>
  Math.ceil((maxTarballBytes * 4) / 3) + 1_048_576;

/** Writes an object once; a different object already at the key is a conflict. */
async function putOnce(
  bucket: R2Bucket,
  key: string,
  value: Bytes | string,
  sha256: string,
): Promise<boolean> {
  const existing = await bucket.head(key);
  if (existing !== null) return existing.customMetadata?.sha256 === sha256;
  await bucket.put(key, value, { customMetadata: { sha256 } });
  return true;
}

/** Applies the `deprecated` fields of a body without attachments. */
async function deprecate(
  deps: RegistryDeps,
  name: string,
  token: PublishTokenRow,
  body: PublishBody,
): Promise<Response> {
  const entries = Object.entries(body.versions ?? {});
  if (entries.length === 0) return failure(400, "no version in the body");
  const rows = await Promise.all(entries.map(([version]) => deps.store.version(name, version)));
  if (rows.some((row) => row === null)) return failure(400, "a new version needs its tarball");
  for (const [index, [version, manifest]] of entries.entries()) {
    const message =
      typeof manifest.deprecated === "string" && manifest.deprecated !== ""
        ? manifest.deprecated
        : null;
    if (rows[index]?.deprecated === message) continue;
    await deps.store.deprecate(name, version, message, {
      at: deps.now().toISOString(),
      action: "deprecate",
      name,
      version,
      actor: `ci:${token.repository}`,
      run: token.run,
      detail: message,
    });
  }
  await forgetPackument(deps.cache, name);
  return json({ ok: true });
}

/**
 * `PUT /@scope%2fname`: publish one version, or deprecate.
 *
 * @example
 * await putPackage(deps, request, "@stackra/core"); // 201 { ok: true, id, version }
 */
export async function putPackage(
  deps: RegistryDeps,
  request: Request,
  name: string,
): Promise<Response> {
  const token = await publishAuth(deps, request, name);
  if (token instanceof Response) return token;
  const { maxTarballBytes, maxUnpackedBytes } = deps.settings;
  if (Number(request.headers.get("content-length") ?? "0") > bodyLimit(maxTarballBytes))
    return failure(413, `tarball is larger than ${maxTarballBytes} bytes`);
  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return failure(400, "body is not JSON");
  }
  // oxlint-disable-next-line no-underscore-dangle -- `_attachments` is the npm publish body field
  const attachments = Object.entries(body._attachments ?? {});
  if (attachments.length === 0) return deprecate(deps, name, token, body);

  const versions = Object.entries(body.versions ?? {});
  const [entry] = versions;
  if (versions.length !== 1 || entry === undefined)
    return failure(400, "publish exactly one version");
  const [version, offered] = entry;
  const tgz = attachments.find(([file]) => file.endsWith(".tgz"))?.[1];
  const sigstore = attachments.find(([file]) => file.endsWith(".sigstore"))?.[1];
  if (typeof tgz?.data !== "string") return failure(400, "the tarball attachment is missing");

  let bytes: Bytes;
  try {
    bytes = fromBase64(tgz.data);
  } catch {
    return failure(400, "the tarball attachment is not base64");
  }
  if (bytes.length > maxTarballBytes)
    return failure(413, `tarball is larger than ${maxTarballBytes} bytes`);
  if ((await deps.store.version(name, version)) !== null)
    return failure(409, `${name}@${version} exists; versions are immutable`);
  const scopeName = splitName(name).scope;
  const scope = await deps.store.scope(scopeName);
  if (scope === null) return failure(404, "not_found");

  let contents: TarballContents;
  try {
    contents = await readTarball(bytes, maxUnpackedBytes);
  } catch (error) {
    if (error instanceof TarballError) return failure(400, error.message);
    throw error;
  }
  const computed = await tarballDigests(bytes);
  const verdict = checkPublish({
    name,
    version,
    scope,
    contents,
    digests: computed,
    clientDist: offered.dist ?? {},
  });
  if (!verdict.ok) return failure(400, verdict.reasons.join("; "));

  const publisher = (await deps.store.publishers(scopeName)).find(
    (row) => row.repository === token.repository,
  );
  if (publisher === undefined)
    return failure(403, `${token.repository} no longer publishes ${scopeName}`);
  let bundle: string | null = null;
  if (typeof sigstore?.data === "string") {
    try {
      bundle = new TextDecoder().decode(fromBase64(sigstore.data));
    } catch {
      return failure(400, "the provenance attachment is not base64");
    }
  }
  const provenance = checkProvenance(bundle, computed.sha256, publisher);
  if (!provenance.ok || bundle === null)
    return failure(400, provenance.ok ? "provenance bundle is missing" : provenance.reason);

  const signature = await deps.signer.sign(name, version, computed.integrity);
  const stored =
    (await putOnce(deps.tarballs, tarballKey(name, version), bytes, computed.sha256)) &&
    (await putOnce(deps.tarballs, attestationKey(name, version), bundle, computed.sha256));
  if (!stored) return failure(409, `${name}@${version} already has different stored bytes`);

  const now = deps.now().toISOString();
  const offeredTags = Object.entries(body["dist-tags"] ?? {})
    .filter(([, target]) => target === version)
    .map(([tag]) => tag);
  const tags =
    offeredTags.length > 0 || "latest" in (await deps.store.distTags(name))
      ? offeredTags
      : ["latest"];
  try {
    await deps.store.publish(
      {
        name,
        version,
        kind: verdict.kind,
        manifest: JSON.stringify(contents.packageJson),
        integrity: computed.integrity,
        shasum: computed.shasum,
        sha256: computed.sha256,
        signatures: JSON.stringify([signature]),
        predicate_type: provenance.predicateType,
        size: bytes.length,
        publisher_run: token.run,
        published_at: now,
        deprecated: null,
      },
      scopeName,
      tags,
      {
        at: now,
        action: "publish",
        name,
        version,
        tag: tags.join(",") || null,
        actor: `ci:${token.repository}`,
        run: token.run,
        detail: computed.integrity,
      },
    );
  } catch (error) {
    if (error instanceof VersionExistsError)
      return failure(409, `${name}@${version} exists; versions are immutable`);
    throw error;
  }
  await forgetPackument(deps.cache, name);
  return json({ ok: true, id: name, version }, 201);
}
