/**
 * Stackra file contract:
 * Purpose: `handleRequest`: the registry's answer to one request.
 * Boundary: dispatch only; each handler owns its rule.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 12 and 14).
 */
import { handleBrowseList } from "#src/browse/handle-browse-list";
import { handleBrowsePackage } from "#src/browse/handle-browse-package";
import { catalogueItem } from "#src/catalogue/catalogue-item";
import { handleEntitlements } from "#src/catalogue/handle-entitlements";
import { listCatalogue } from "#src/catalogue/list-catalogue";
import { failure } from "#src/http/failure";
import { parsePath } from "#src/http/parse-path";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { handleAttestations } from "#src/npm/handle-attestations";
import { handleKeys } from "#src/npm/handle-keys";
import { handleLogin } from "#src/npm/handle-login";
import { handlePackument } from "#src/npm/handle-packument";
import { handlePing } from "#src/npm/handle-ping";
import { readDistTags } from "#src/npm/read-dist-tags";
import { handleTarball } from "#src/npm/handle-tarball";
import { handleUnpublish } from "#src/npm/handle-unpublish";
import { handleVersion } from "#src/npm/handle-version";
import { handleWhoami } from "#src/npm/handle-whoami";
import { handleLicences } from "#src/licence/handle-licences";
import { exchangeToken } from "#src/oidc/exchange-token";
import { putPackage } from "#src/publish/put-package";
import { writeDistTag } from "#src/publish/write-dist-tag";

/** 405 with the allowed methods. */
const notAllowed = (allow: string): Response => failure(405, "method not allowed", { allow });

/** Dispatches one request. */
async function dispatch(request: Request, deps: RegistryDeps): Promise<Response> {
  const url = new URL(request.url);
  const route = parsePath(url.pathname);
  const method = request.method === "HEAD" ? "GET" : request.method;
  switch (route.kind) {
    case "browseList": {
      return method === "GET" ? handleBrowseList(deps, url, route.locale) : notAllowed("GET");
    }
    case "browsePackage": {
      return method === "GET"
        ? handleBrowsePackage(deps, request, route.name, route.locale)
        : notAllowed("GET");
    }
    case "ping": {
      return method === "GET" ? handlePing() : notAllowed("GET");
    }
    case "whoami": {
      return method === "GET" ? handleWhoami(deps, request) : notAllowed("GET");
    }
    case "keys": {
      return method === "GET" ? handleKeys(deps) : notAllowed("GET");
    }
    case "login": {
      return handleLogin(deps);
    }
    case "exchange": {
      return method === "POST" ? exchangeToken(deps, request, route.name) : notAllowed("POST");
    }
    case "attestations": {
      return method === "GET"
        ? handleAttestations(deps, request, route.name, route.version)
        : notAllowed("GET");
    }
    case "distTags": {
      if (route.tag === null)
        return method === "GET" ? readDistTags(deps, request, route.name) : notAllowed("GET");
      return method === "PUT" || method === "DELETE"
        ? writeDistTag(deps, request, route.name, route.tag)
        : notAllowed("PUT, DELETE");
    }
    case "package": {
      if (method === "GET") return handlePackument(deps, request, route.name);
      if (method === "PUT") return putPackage(deps, request, route.name);
      return method === "DELETE" ? handleUnpublish() : notAllowed("GET, PUT");
    }
    case "unpublish": {
      return handleUnpublish();
    }
    case "version": {
      if (method === "DELETE") return handleUnpublish();
      return method === "GET"
        ? handleVersion(deps, request, route.name, route.spec)
        : notAllowed("GET");
    }
    case "tarball": {
      if (method === "DELETE") return handleUnpublish();
      return method === "GET"
        ? handleTarball(deps, request, route.name, route.file)
        : notAllowed("GET");
    }
    case "catalogue": {
      return method === "GET" ? listCatalogue(deps, url) : notAllowed("GET");
    }
    case "catalogueItem": {
      return method === "GET" ? catalogueItem(deps, route.name) : notAllowed("GET");
    }
    case "entitlements": {
      return method === "GET" ? handleEntitlements(deps, request) : notAllowed("GET");
    }
    case "licences": {
      return handleLicences(deps, request, route.rest);
    }
    case "unknown": {
      return failure(404, "not_found");
    }
  }
}

/**
 * The registry's answer to one request.
 *
 * @example
 * const response = await handleRequest(new Request("https://npm.stackra.figentra.com/-/ping"), deps);
 */
export async function handleRequest(request: Request, deps: RegistryDeps): Promise<Response> {
  try {
    const response = await dispatch(request, deps);
    return request.method === "HEAD"
      ? new Response(null, { status: response.status, headers: response.headers })
      : response;
  } catch (error) {
    // The name and message only: no handler puts a token or a request body into an error message.
    console.error(
      "stackra-registry",
      error instanceof Error ? `${error.name}: ${error.message}` : "unknown error",
    );
    return failure(500, "internal_error");
  }
}
