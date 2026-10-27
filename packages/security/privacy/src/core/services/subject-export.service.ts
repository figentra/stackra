/**
 * Stackra file contract:
 * Purpose: `SubjectExportService`, the DSAR export: collects one subject's rows across every registered
 *          `PersonalData` declaration, and writes them as a zip (a manifest plus one JSON file per model) to the host
 *          disk behind a signed link that lives `PrivacyConfig.exportTtlDays`.
 * Boundary: reads through `PersonalDataStore` (declared fields only) and writes through `FileSystem`; it never signs
 *           anything itself, the disk driver does. The zip's name is random, so neither the path nor the link names
 *           the subject. Every declared model is searched, empty ones too, and listed in the manifest.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 1); GDPR Art. 15 and 20; PDPL Art. 4; STA-1375.
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { writeZip } from "@stackra/data-transfer";
import type { ZipEntry } from "@stackra/data-transfer";
import type { FileSystem } from "@stackra/filesystem/contracts";

import type { PrivacyConfig } from "#config/privacy.config";
import type { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import type { SubjectExport } from "#contracts/types/subject-export.type";
import type { SubjectExportSection } from "#contracts/types/subject-export-section.type";
import { personalDataDeclarations } from "#core/functions/personal-data-declarations.function";
import type { SubjectExportLink } from "#core/types/subject-export-link.type";

/** Milliseconds in a day. */
const DAY = 86_400_000;

/**
 * Collects and writes DSAR exports.
 *
 * @example
 * const link = await exports.archive(await exports.collect("usr_01…", ctx.now()));
 */
export class SubjectExportService extends Service {
  /** Reads the subject's rows. */
  private readonly store: PersonalDataStore;

  /** The host disk the zip is written to. */
  private readonly files: FileSystem;

  /** The export window and folder. */
  private readonly config: PrivacyConfig;

  /**
   * @param store - reads the subject's rows.
   * @param files - the disk exports are written to.
   * @param config - the export window and folder.
   */
  constructor(store: PersonalDataStore, files: FileSystem, config: PrivacyConfig) {
    super();
    this.store = store;
    this.files = files;
    this.config = config;
  }

  /** Everything the declared models hold about `subject`, as at `at`. */
  async collect(subject: string, at: Date): Promise<SubjectExport> {
    const sections: SubjectExportSection[] = [];
    for (const { kind, model, subject: field, fields } of personalDataDeclarations())
      sections.push({
        kind,
        records: await this.store.find(model, field, subject, Object.keys(fields)),
      });
    return { subject, generatedAt: at.toISOString(), sections };
  }

  /** Writes `data` as a zip and returns its signed link, valid for `exportTtlDays` from the export's time. */
  async archive(data: SubjectExport): Promise<SubjectExportLink> {
    const at = new Date(data.generatedAt);
    const encoder = new TextEncoder();
    const json = (value: unknown): Uint8Array[] => [encoder.encode(JSON.stringify(value, null, 2))];
    const manifest = {
      subject: data.subject,
      generatedAt: data.generatedAt,
      sections: data.sections.map(({ kind, records }) => ({ kind, count: records.length })),
    };
    const entries: ZipEntry[] = [
      { name: "manifest.json", bytes: json(manifest) },
      ...data.sections.map(({ kind, records }) => ({
        name: `data/${kind}.json`,
        bytes: json(records),
      })),
    ];
    const path = `${this.config.exportFolder}/${globalThis.crypto.randomUUID()}.zip`;
    await this.files.writeStream(path, writeZip(entries, at), {
      contentType: "application/zip",
    });
    const ttl = Duration.days(this.config.exportTtlDays);
    return {
      path,
      url: await this.files.temporaryUrl(path, ttl),
      expiresAt: new Date(at.getTime() + this.config.exportTtlDays * DAY).toISOString(),
      records: data.sections.reduce((sum, { records }) => sum + records.length, 0),
    };
  }
}
