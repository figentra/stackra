/**
 * Stackra file contract:
 * Purpose: unit tests of `BrandReader#profile`: plain (all `null`) when nothing is set; the platform's values at the
 *          root and at a tenant that sets nothing; a tenant's values over the platform's field by field; a colour that
 *          fails its contrast rule ignored for the next readable layer (else `null`), never throwing; the display
 *          name in the asked locale, else the other, blank counting as unset; each colour with its on-colour; a logo
 *          claimed through media resolved with its variant URLs, the mark falling back to it, and an id with no file
 *          read as `null`.
 * Boundary: test only; the real `SettingsReader` over settings' memory store (the platform at the root, the tenant at
 *           a node below it), and the real `MediaLibrary` over the memory `FileSystem` disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222; ADR 0213 (decision 2: the cascade); STA-2644 (FR-004).
 */
import { buildConfig } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { Locale } from "@stackra/i18n";
import { MediaConfig, MediaLibrary, MediaType } from "@stackra/media";
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { describe, expect, it } from "@stackra/testing";

import { BrandAssetsBucket } from "#node/models/brand-assets.bucket";
import { BrandReader } from "#node/services/brand-reader.service";

/** A fixed clock. */
class TestClock extends Clock {
  /** Always the same instant. */
  now(): Date {
    return new Date("2026-11-09T09:00:00.000Z");
  }
}

/** A PNG signature: enough for media's content check. */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The tenant's scope node, one level below the platform root. */
const ACME_NODE: ScopeRef = {
  id: "scp_01jc5w3b4k6m7n8p9q0r1s2t3v" as PublicId<"scp">,
  path: "acme",
};

/** A reader over a fresh store and disk, with the store, disk and media library for the test to fill. */
function setup() {
  const clock = new TestClock();
  const disk = new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    clock,
  );
  const store = new MemorySettingValueStoreDriver();
  const reader = new BrandReader(new SettingsReader(store), store, disk);
  return { disk, store, reader, media: new MediaLibrary(disk, buildConfig(MediaConfig), clock) };
}

/** `BrandReader`. */
describe("BrandReader", () => {
  /** Plain until a level sets something. */
  it("is plain when nothing is set", async () => {
    const { reader } = setup();
    expect(await reader.profile(Locale.En)).toEqual({
      displayName: null,
      logo: null,
      mark: null,
      primary: null,
      accent: null,
    });
  });

  /** Platform values reach every tenant that sets nothing. */
  it("reads the platform's values at the root and at a tenant that sets nothing", async () => {
    const { reader, store } = setup();
    store.seed("branding", { "displayName.en": "Figentra", primaryColor: "#1D4ED8" });
    for (const target of [{}, { scope: ACME_NODE }]) {
      const profile = await reader.profile(Locale.En, target);
      expect(profile.displayName).toBe("Figentra");
      expect(profile.primary).toEqual({ color: "#1D4ED8", onColor: "#FFFFFF" });
    }
  });

  /** Tenant → platform, field by field. */
  it("lays a tenant's values over the platform's, field by field", async () => {
    const { reader, store } = setup();
    store.seed("branding", {
      "displayName.en": "Figentra",
      primaryColor: "#1D4ED8",
      accentColor: "#B45309",
    });
    await store.write(
      "branding",
      { scope: ACME_NODE },
      {
        "displayName.ar": "متجر النخلة",
        primaryColor: "#FACC15",
      },
    );
    const profile = await reader.profile(Locale.Ar, { scope: ACME_NODE });
    expect(profile.displayName).toBe("متجر النخلة");
    expect(profile.primary).toEqual({ color: "#FACC15", onColor: "#111111" });
    expect(profile.accent).toEqual({ color: "#B45309", onColor: "#FFFFFF" });
  });

  /** A failing colour counts as unset: the next readable layer out wins, and profile() never throws. */
  it("ignores a tenant's low-contrast colour and falls back to the platform's", async () => {
    const { reader, store } = setup();
    store.seed("branding", { primaryColor: "#1D4ED8" });
    await store.write(
      "branding",
      { scope: ACME_NODE },
      {
        primaryColor: "#777777",
        accentColor: "#AAAAAA",
      },
    );
    const profile = await reader.profile(Locale.En, { scope: ACME_NODE });
    expect(profile.primary).toEqual({ color: "#1D4ED8", onColor: "#FFFFFF" });
    expect(profile.accent).toBeNull();
  });

  /** No readable layer at all: plain. */
  it("reads a low-contrast colour with no readable layer above it as null", async () => {
    const { reader, store } = setup();
    store.seed("branding", { primaryColor: "#777777" });
    await store.write("branding", { scope: ACME_NODE }, { accentColor: "#B45309" });
    const profile = await reader.profile(Locale.En, { scope: ACME_NODE });
    expect(profile.primary).toBeNull();
    expect(profile.accent).toEqual({ color: "#B45309", onColor: "#FFFFFF" });
  });

  /** The asked locale, then the other one; regional locales use their language. */
  it("picks the display name for the locale and falls back to the other", async () => {
    const { reader, store } = setup();
    store.seed("branding", { "displayName.en": "Palm Store", "displayName.ar": "متجر النخلة" });
    expect((await reader.profile(Locale.ArSa)).displayName).toBe("متجر النخلة");
    expect((await reader.profile(Locale.EnUs)).displayName).toBe("Palm Store");
    store.seed("branding", { "displayName.en": null, "displayName.ar": "متجر النخلة" });
    expect((await reader.profile(Locale.En)).displayName).toBe("متجر النخلة");
    store.seed("branding", { "displayName.ar": "  " });
    expect((await reader.profile(Locale.Ar)).displayName).toBeNull();
  });

  /** A claimed logo, its variants, and the mark falling back to it. */
  it("resolves a claimed logo with its variant URLs and falls back to it for the mark", async () => {
    const { reader, store, disk, media } = setup();
    const pending = await media.createUpload(BrandAssetsBucket, {
      mediaType: MediaType.Png,
      size: PNG.length,
    });
    await disk.receive(pending.url, pending.headers, PNG);
    const file = await media.claim(pending.upload, BrandAssetsBucket);
    store.seed("branding", { logo: file.id });
    const { logo, mark } = await reader.profile(Locale.En);
    expect(logo).toEqual({
      id: file.id,
      url: file.url,
      mediaType: MediaType.Png,
      variants: {
        print: { url: `${file.url}?w=600`, width: 600 },
        email: { url: `${file.url}?w=400`, width: 400 },
        mark: { url: `${file.url}?w=512&h=512`, width: 512, height: 512 },
      },
    });
    expect(mark).toEqual(logo);
  });

  /** A surface that embeds the image reads its bytes from the disk, not its URL. */
  it("reads a resolved logo's original bytes, and null once the file is gone", async () => {
    const { reader, store, disk, media } = setup();
    const pending = await media.createUpload(BrandAssetsBucket, {
      mediaType: MediaType.Png,
      size: PNG.length,
    });
    await disk.receive(pending.url, pending.headers, PNG);
    const file = await media.claim(pending.upload, BrandAssetsBucket);
    store.seed("branding", { logo: file.id });
    const { logo } = await reader.profile(Locale.En);
    const read = async () => (logo === null ? undefined : reader.bytes(logo));
    expect(await read()).toEqual(PNG);
    await disk.delete(file.path);
    expect(await read()).toBeNull();
  });

  /** An id whose file is not on the disk (never claimed, or deleted). */
  it("reads an id with no claimed file as null", async () => {
    const { reader, store } = setup();
    store.seed("branding", { logo: "upl_01jc5w3b4k6m7n8p9q0r1s2t3v" });
    expect((await reader.profile(Locale.En)).logo).toBeNull();
  });
});
