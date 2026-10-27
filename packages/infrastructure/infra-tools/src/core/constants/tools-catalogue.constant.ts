/**
 * Stackra file contract:
 * Purpose: `TOOLS_CATALOGUE`, the default container of each self-hosted tool in a region's tools stack (owner
 *          decisions R2-5, R2-6, R2-9, R2-10 and R3-5): Documenso (e-signature), the OCR server (PaddleOCR by default,
 *          Surya by setting, both Figentra's image from `images/ocr`), Nominatim (geocoding) on the region's extract,
 *          Photon (address autocomplete, Figentra's image from `images/photon`, imported from Nominatim's database),
 *          LibreTranslate (offline translation) and Chatwoot (help desk) with its Sidekiq worker.
 * Boundary: data; every field is a default the root runway's `providers.tools.tools.<key>` may override (image, size,
 *           replicas, environment, provider, enabled, storage, disk, instance type). Images are pinned to tags at
 *           least two weeks old, checked against their registries on 2026-10-27 (README "Pinned images"). Secret
 *           names only (ADR 0173). Documenso runs unmodified as its own service (AGPL, R2-6).
 * Runtime: isomorphic
 * Governing contract: owner decisions R2-5, R2-6, R2-9, R2-10, R3-5 (2026-10-26); ADR 0444; ADR 0173; ADR 0238.
 */
import type { ToolDefinition } from "#core/types/tool-definition.type";

/** Chatwoot's Rails environment, shared by the web process and the worker. */
const CHATWOOT_ENVIRONMENT = {
  RAILS_ENV: "production",
  NODE_ENV: "production",
  RAILS_LOG_TO_STDOUT: "true",
} as const;

/** Tool key to its default container. */
export const TOOLS_CATALOGUE = {
  documenso: {
    image: "documenso/documenso:v2.20.0",
    port: 3000,
    cpu: 512,
    memoryMb: 1024,
    replicas: 1,
    environment: {
      PORT: "3000",
      NEXT_PRIVATE_SIGNING_TRANSPORT: "local",
      DOCUMENSO_DISABLE_TELEMETRY: "true",
    },
    secrets: [
      "NEXTAUTH_SECRET",
      "NEXT_PRIVATE_ENCRYPTION_KEY",
      "NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY",
      "NEXT_PRIVATE_DATABASE_URL",
      "NEXT_PRIVATE_DIRECT_DATABASE_URL",
      "NEXT_PRIVATE_SIGNING_PASSPHRASE",
      "NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS",
    ],
    database: { name: "documenso" },
    connection: { category: "e-signature", provider: "documenso" },
  },
  ocr: {
    // The engine is baked into the image (images/ocr, build argument ENGINE): one tag per engine.
    image: "ghcr.io/figentra/tools-ocr:1.0.0-paddleocr",
    providerImages: { surya: "ghcr.io/figentra/tools-ocr:1.0.0-surya" },
    port: 8080,
    cpu: 2048,
    memoryMb: 4096,
    replicas: 1,
    environment: { OCR_LANGUAGES: "ar,en" },
    secrets: [],
    connection: { category: "ocr", provider: "paddleocr" },
  },
  nominatim: {
    image: "mediagis/nominatim:5.3.2",
    port: 8080,
    cpu: 2048,
    memoryMb: 8192,
    replicas: 1,
    environment: { IMPORT_STYLE: "full", UPDATE_MODE: "continuous" },
    secrets: ["NOMINATIM_PASSWORD"],
    volume: "/var/lib/postgresql/16/main",
    // Postgres on EFS makes the import and the updates slow: Nominatim keeps its data on an EBS disk by default.
    storage: "ebs",
    diskGb: 200,
    instanceType: "m6i.xlarge",
    extract: { url: "PBF_URL", updates: "REPLICATION_URL" },
    connection: { category: "geocoding", provider: "nominatim" },
  },
  photon: {
    // images/photon: imports from the region's Nominatim database on first start, then serves.
    image: "ghcr.io/figentra/tools-photon:1.3.0",
    port: 2322,
    cpu: 1024,
    memoryMb: 4096,
    replicas: 1,
    environment: { NOMINATIM_HOST: "nominatim.{namespace}", PHOTON_LANGUAGES: "ar,en" },
    secrets: ["NOMINATIM_PASSWORD"],
    volume: "/photon/photon_data",
    requires: "nominatim",
    connection: { category: "address-autocomplete", provider: "photon" },
  },
  libretranslate: {
    image: "libretranslate/libretranslate:v1.9.6",
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
    image: "chatwoot/chatwoot:v4.18.0",
    port: 3000,
    cpu: 1024,
    memoryMb: 2048,
    replicas: 1,
    command: ["bundle", "exec", "rails", "s", "-p", "3000", "-b", "0.0.0.0"],
    environment: CHATWOOT_ENVIRONMENT,
    secrets: ["SECRET_KEY_BASE", "DATABASE_URL"],
    cache: "REDIS_URL",
    database: {
      name: "chatwoot",
      extensions: ["pg_trgm", "pgcrypto", "pg_stat_statements", "vector"],
    },
    connection: { category: "help-desk", provider: "chatwoot" },
  },
  "chatwoot-worker": {
    image: null,
    partOf: "chatwoot",
    cpu: 1024,
    memoryMb: 2048,
    replicas: 1,
    command: ["bundle", "exec", "sidekiq", "-C", "config/sidekiq.yml"],
    environment: CHATWOOT_ENVIRONMENT,
    secrets: ["SECRET_KEY_BASE", "DATABASE_URL"],
    cache: "REDIS_URL",
  },
} as const satisfies Readonly<Record<string, ToolDefinition>>;
