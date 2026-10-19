import type { {{PASCAL}}Record } from "#core";

/** Port: what the use cases need from storage. Owned here; implemented in infrastructure. */
export interface {{PASCAL}}Repository {
  findById(id: string): Promise<{{PASCAL}}Record | undefined>;
  save(record: {{PASCAL}}Record): Promise<void>;
}
