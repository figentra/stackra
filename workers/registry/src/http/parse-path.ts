/**
 * Stackra file contract:
 * Purpose: `parsePath`: the route of a request path.
 * Boundary: pure; no method check and no lookup (the router does both).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 12 and 14).
 */
import type { RegistryRoute } from "#src/interfaces/registry-route.type";

/** A scoped name: `@scope/name`, lower case, npm's URL-safe characters. */
const NAME = /^@[a-z0-9][a-z0-9-._~]*\/[a-z0-9][a-z0-9-._~]*$/;

const UNKNOWN: RegistryRoute = { kind: "unknown" };

/** A valid scoped name, or null. */
const scoped = (name: string): string | null => (NAME.test(name) ? name : null);

/** The `/-/…` routes. */
function parseDash(path: string): RegistryRoute {
  const fixed: Readonly<Record<string, RegistryRoute>> = {
    "/-/ping": { kind: "ping" },
    "/-/whoami": { kind: "whoami" },
    "/-/npm/v1/keys": { kind: "keys" },
    "/-/stackra/v1/catalogue": { kind: "catalogue" },
    "/-/stackra/v1/entitlements": { kind: "entitlements" },
  };
  const exact = fixed[path];
  if (exact !== undefined) return exact;
  if (path.startsWith("/-/user/")) return { kind: "login" };
  const after = (prefix: string): string | null =>
    path.startsWith(prefix) ? path.slice(prefix.length) : null;

  const exchange = after("/-/npm/v1/oidc/token/exchange/package/");
  if (exchange !== null) {
    const name = scoped(exchange);
    return name === null ? UNKNOWN : { kind: "exchange", name };
  }
  const attested = after("/-/npm/v1/attestations/");
  if (attested !== null) {
    const at = attested.lastIndexOf("@");
    const name = at > 0 ? scoped(attested.slice(0, at)) : null;
    return name === null
      ? UNKNOWN
      : { kind: "attestations", name, version: attested.slice(at + 1) };
  }
  if (path === "/-/stackra/v1/licences") return { kind: "licences", rest: [] };
  const licences = after("/-/stackra/v1/licences/");
  if (licences !== null) return { kind: "licences", rest: licences.split("/") };
  const item = after("/-/stackra/v1/catalogue/");
  if (item !== null) {
    const name = scoped(item);
    return name === null ? UNKNOWN : { kind: "catalogueItem", name };
  }
  const tags = after("/-/package/");
  if (tags !== null) {
    const parts = tags.split("/");
    const name = scoped(`${parts[0]}/${parts[1]}`);
    if (name === null || parts[2] !== "dist-tags" || parts.length > 4) return UNKNOWN;
    const tag = parts[3];
    return { kind: "distTags", name, tag: tag === undefined || tag === "" ? null : tag };
  }
  return UNKNOWN;
}

/** The browser routes: `/` and `/package/@scope/name`, unprefixed (English) or under `/ar` (Arabic); else null. */
function parseBrowse(path: string): RegistryRoute | null {
  const arabic = path === "/ar" || path.startsWith("/ar/");
  const rest = arabic ? path.slice("/ar".length) || "/" : path;
  const locale = arabic ? "ar" : "en";
  if (rest === "/") return { kind: "browseList", locale };
  if (!rest.startsWith("/package/")) return arabic ? UNKNOWN : null;
  const name = scoped(rest.slice("/package/".length));
  return name === null ? UNKNOWN : { kind: "browsePackage", locale, name };
}

/**
 * The route of a request path. The browser takes only `/`, `/ar…` and `/package/…`: npm never asks for them (its
 * paths are `/-/…` and scoped `/@scope/…`), so every npm route parses as before.
 *
 * @example
 * parsePath("/"); // { kind: "browseList", locale: "en" }
 * parsePath("/ar/package/@stackra/core"); // { kind: "browsePackage", locale: "ar", name: "@stackra/core" }
 * parsePath("/@stackra%2fcore"); // { kind: "package", name: "@stackra/core" }
 * parsePath("/@stackra/core/-/core-1.0.0.tgz"); // { kind: "tarball", name: "@stackra/core", file: "core-1.0.0.tgz" }
 */
export function parsePath(pathname: string): RegistryRoute {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return UNKNOWN;
  }
  if (path.startsWith("/-/")) return parseDash(path);
  const browse = parseBrowse(path);
  if (browse !== null) return browse;
  const [scope, bare, ...rest] = path.slice(1).split("/");
  const name = scope?.startsWith("@") === true ? scoped(`${scope}/${bare ?? ""}`) : null;
  if (name === null) return UNKNOWN;
  if (rest.length === 0) return { kind: "package", name };
  const [first, second] = rest;
  if (first === "-rev") return { kind: "unpublish", name };
  if (first === "-" && rest.length === 2 && second !== undefined && second.endsWith(".tgz"))
    return { kind: "tarball", name, file: second };
  if (rest.length === 1 && first !== undefined && first !== "" && first !== "-")
    return { kind: "version", name, spec: first };
  return UNKNOWN;
}
