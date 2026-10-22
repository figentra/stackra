/**
 * Stackra file contract:
 * Purpose: the Cache-Control value sent for an exact-version path such as `/1.4.0/runway/app.json`.
 * Boundary: a constant only; render-headers.ts writes it into the generated `_headers` file.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 4).
 */

/**
 * One year, `immutable`: an exact-version file is built from a git tag that never moves, so a client may keep it
 * forever without revalidating. Moving paths (the `$id` path, `/latest/`, `/v<major>/`) get no rule and keep
 * Cloudflare's default `public, max-age=0, must-revalidate` with an ETag, so a change shows up on the next request.
 */
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
