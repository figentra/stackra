/**
 * Stackra file contract:
 * Purpose: `writeDistTag`: `PUT` (body: the version as a JSON string) or `DELETE
 *          /-/package/@scope%2fname/dist-tags/<tag>`.
 * Boundary: writes through `RegistryStore`, R2 and KV only. No unpublish and no human publish.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 6, 7, 8, 9 and 11); ADR 0013 (immutable versions).
 */
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { forgetPackument } from "#src/npm/forget-packument";
import { publishAuth } from "#src/publish/publish-auth";

/**
 * `PUT` (body: the version as a JSON string) or `DELETE /-/package/@scope%2fname/dist-tags/<tag>`.
 *
 * @example
 * await writeDistTag(deps, request, "@stackra/core", "canary"); // 201 { ok: true }
 */
export async function writeDistTag(
  deps: RegistryDeps,
  request: Request,
  name: string,
  tag: string,
): Promise<Response> {
  const token = await publishAuth(deps, request, name);
  if (token instanceof Response) return token;
  const audit = {
    at: deps.now().toISOString(),
    name,
    tag,
    actor: `ci:${token.repository}`,
    run: token.run,
  };
  if (request.method === "DELETE") {
    if (tag === "latest") return failure(400, "the latest tag cannot be removed");
    await deps.store.deleteDistTag(name, tag, { ...audit, action: "dist-tag.delete" });
  } else {
    let target: unknown;
    try {
      target = await request.json();
    } catch {
      return failure(400, "body must be a JSON string version");
    }
    if (typeof target !== "string" || (await deps.store.version(name, target)) === null)
      return failure(404, "that version does not exist");
    await deps.store.setDistTag(name, tag, target, {
      ...audit,
      action: "dist-tag.set",
      version: target,
    });
  }
  await forgetPackument(deps.cache, name);
  return json({ ok: true }, 201);
}
