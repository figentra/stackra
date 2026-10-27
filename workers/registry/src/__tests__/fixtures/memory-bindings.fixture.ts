/**
 * Stackra file contract:
 * Purpose: in-memory fakes of the R2 bucket, the KV namespace and the edge cache, and `MemoryLicenceCheck`, the
 *          in-memory fake of the `LicenceCheck` port (the real one is `D1LicenceCheck`, tested over node:sqlite). Each fake records every call
 *          with all its arguments.
 * Boundary: test fixtures only; no expiry is simulated (KV and cache entries live for the test).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 3 and 13); BUILDER-RULES 6e.
 */
import type { LicenceCheck } from "#src/access/licence-check.port";
import type { LicenceView } from "#src/interfaces/licence-view.interface";
import type { EdgeCache } from "#src/interfaces/edge-cache.interface";
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import type { R2Body } from "#src/interfaces/r2-body.interface";
import type { R2Bucket } from "#src/interfaces/r2-bucket.interface";
import type { R2Head } from "#src/interfaces/r2-head.interface";

/** An R2 bucket in memory. */
export class MemoryR2 implements R2Bucket {
  readonly objects = new Map<
    string,
    { bytes: Uint8Array; customMetadata: Record<string, string> }
  >();
  readonly calls: { readonly method: string; readonly args: readonly unknown[] }[] = [];

  async head(key: string): Promise<R2Head | null> {
    this.calls.push({ method: "head", args: [key] });
    const object = this.objects.get(key);
    return object === undefined
      ? null
      : { size: object.bytes.length, customMetadata: object.customMetadata };
  }

  async get(key: string): Promise<R2Body | null> {
    this.calls.push({ method: "get", args: [key] });
    const object = this.objects.get(key);
    if (object === undefined) return null;
    return {
      size: object.bytes.length,
      customMetadata: object.customMetadata,
      body: new Blob([new Uint8Array(object.bytes)]).stream(),
    };
  }

  async put(
    key: string,
    value: Uint8Array | string,
    options?: { readonly customMetadata?: Record<string, string> },
  ): Promise<unknown> {
    this.calls.push({ method: "put", args: [key, value, options] });
    const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
    this.objects.set(key, { bytes, customMetadata: options?.customMetadata ?? {} });
    return {};
  }
}

/** A KV namespace in memory. */
export class MemoryKv implements KvNamespace {
  readonly values = new Map<string, string>();
  readonly calls: { readonly method: string; readonly args: readonly unknown[] }[] = [];

  async get(key: string): Promise<string | null> {
    this.calls.push({ method: "get", args: [key] });
    return this.values.get(key) ?? null;
  }

  async put(
    key: string,
    value: string,
    options?: { readonly expirationTtl?: number },
  ): Promise<void> {
    this.calls.push({ method: "put", args: [key, value, options] });
    this.values.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.calls.push({ method: "delete", args: [key] });
    this.values.delete(key);
  }
}

/** The edge cache in memory. */
export class MemoryEdgeCache implements EdgeCache {
  readonly entries = new Map<string, { body: string; cacheControl: string | null }>();
  readonly calls: { readonly method: string; readonly url: string }[] = [];

  async match(request: Request): Promise<Response | undefined> {
    this.calls.push({ method: "match", url: request.url });
    const entry = this.entries.get(request.url);
    return entry === undefined ? undefined : new Response(entry.body);
  }

  async put(request: Request, response: Response): Promise<void> {
    this.calls.push({ method: "put", url: request.url });
    this.entries.set(request.url, {
      body: await response.text(),
      cacheControl: response.headers.get("cache-control"),
    });
  }
}

/** The in-memory licence check: tokens mapped to licences. */
export class MemoryLicenceCheck implements LicenceCheck {
  readonly licences = new Map<string, LicenceView>();
  readonly calls: { readonly token: string }[] = [];

  async check(token: string): Promise<LicenceView | null> {
    this.calls.push({ token });
    return this.licences.get(token) ?? null;
  }
}

/** An active licence with a grant on every `@stackra-pro` name. */
export const activeLicence = (overrides: Partial<LicenceView> = {}): LicenceView => ({
  licenceId: "lic_1",
  tokenId: "tok_1",
  holder: "os:account:acme",
  status: "active",
  notBefore: null,
  expiresAt: null,
  grants: [{ scope: "@stackra-pro", names: "*" }],
  internal: false,
  ...overrides,
});
