/**
 * Stackra file contract:
 * Purpose: `TOOLS_CATALOGUE`, the default container of each self-hosted tool in a region's tools stack (owner
 *          decisions R2-5, R2-6, R2-9, R2-10 and R3-5): Documenso (e-signature), the OCR server (PaddleOCR by default,
 *          Surya by setting), Nominatim (geocoding) and Photon (address autocomplete) on the region's extract,
 *          LibreTranslate (offline translation) and Chatwoot (help desk) with its Sidekiq worker.
 * Boundary: data; every field is a default the root runway's `providers.tools.tools.<key>` may override (image, size,
 *           replicas, environment, provider, enabled). Images are pinned; an image `null` has no upstream build and the
 *           runway must name Figentra's. Secret names only (ADR 0173). Documenso runs unmodified as its own service
 *           (AGPL, R2-6).
 * Runtime: isomorphic
 * Governing contract: owner decisions R2-5, R2-6, R2-9, R2-10, R3-5 (2026-10-26); ADR 0444; ADR 0173.
 */
import type { ToolDefinition } from "#core/types/tool-definition.type";

/** Tool key to its default container. */
export const TOOLS_CATALOGUE = {
  documenso: {
    image: "documenso/documenso:v1.9.0",
    port: 3000,
    cpu: 512,
    memoryMb: 1024,
    replicas: 1,
    environment: { PORT: "3000" },
    secrets: [
      "NEXTAUTH_SECRET",
      "NEXT_PRIVATE_ENCRYPTION_KEY",
      "NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY",
      "NEXT_PRIVATE_DATABASE_URL",
      "NEXT_PRIVATE_DIRECT_DATABASE_URL",
      "NEXT_PRIVATE_SIGNING_PASSPHRASE",
    ],
    connection: { category: "e-signature", provider: "documenso" },
  },
  ocr: {
    // No upstream HTTP server image for PaddleOCR or Surya: the runway names the one Figentra builds.
    image: null,
    port: 8080,
    cpu: 2048,
    memoryMb: 4096,
    replicas: 1,
    environment: { OCR_ENGINE: "paddleocr", OCR_LANGUAGES: "ar,en" },
    secrets: [],
    connection: { category: "ocr", provider: "paddleocr" },
  },
  nominatim: {
    image: "mediagis/nominatim:4.5",
    port: 8080,
    cpu: 2048,
    memoryMb: 8192,
    replicas: 1,
    environment: { IMPORT_STYLE: "full", UPDATE_MODE: "continuous" },
    secrets: ["NOMINATIM_PASSWORD"],
    volume: "/var/lib/postgresql/16/main",
    extract: { url: "PBF_URL", updates: "REPLICATION_URL" },
    connection: { category: "geocoding", provider: "nominatim" },
  },
  photon: {
    // No upstream image for Photon: the runway names the one Figentra builds.
    image: null,
    port: 2322,
    cpu: 1024,
    memoryMb: 4096,
    replicas: 1,
    environment: {},
    secrets: [],
    volume: "/photon/photon_data",
    extract: { url: "OSM_EXTRACT_URL" },
    connection: { category: "address-autocomplete", provider: "photon" },
  },
  libretranslate: {
    image: "libretranslate/libretranslate:v1.6.2",
    port: 5000,
    cpu: 2048,
    memoryMb: 4096,
    replicas: 1,
    environment: { LT_LOAD_ONLY: "ar,en,fr,de,es,tr,ur", LT_UPDATE_MODELS: "true" },
    secrets: [],
    volume: "/home/libretranslate/.local",
    connection: { category: "translation", provider: "libretranslate" },
  },
  chatwoot: {
    image: "chatwoot/chatwoot:v4.1.0",
    port: 3000,
    cpu: 1024,
    memoryMb: 2048,
    replicas: 1,
    command: ["bundle", "exec", "rails", "s", "-p", "3000", "-b", "0.0.0.0"],
    environment: { RAILS_ENV: "production", NODE_ENV: "production", RAILS_LOG_TO_STDOUT: "true" },
    secrets: ["SECRET_KEY_BASE", "DATABASE_URL", "REDIS_URL"],
    connection: { category: "help-desk", provider: "chatwoot" },
  },
  "chatwoot-worker": {
    image: null,
    partOf: "chatwoot",
    cpu: 1024,
    memoryMb: 2048,
    replicas: 1,
    command: ["bundle", "exec", "sidekiq", "-C", "config/sidekiq.yml"],
    environment: { RAILS_ENV: "production", NODE_ENV: "production", RAILS_LOG_TO_STDOUT: "true" },
    secrets: ["SECRET_KEY_BASE", "DATABASE_URL", "REDIS_URL"],
  },
} as const satisfies Readonly<Record<string, ToolDefinition>>;
